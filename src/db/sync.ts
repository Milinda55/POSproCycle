// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { RxDBReplicationCouchDBPlugin } from 'rxdb/plugins/replication-couchdb';
import { addRxPlugin } from 'rxdb';
import type { BikePoSDatabase } from './initDB';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import type { CouchDBReplicationOptions, RxReplicationState } from 'rxdb/plugins/replication-couchdb';
import type { RxCollection } from 'rxdb';

// Add CouchDB replication plugin
addRxPlugin(RxDBReplicationCouchDBPlugin);

interface SyncableCollection<DocType> extends RxCollection<DocType> {
    syncCouchDB: (options: CouchDBReplicationOptions) => RxReplicationState;
}

interface SyncConfig {
    remoteCouchDBUrl: string;
    remoteCouchDBName: string;
    collections: Array<'products' | 'sales' | 'settings'>;
}

export class POSReplicator {
    private db: BikePoSDatabase;
    private syncStates: Map<string, RxReplicationState> = new Map();

    constructor(db: BikePoSDatabase) {
        this.db = db;
    }

    public startSync(config: SyncConfig): void {
        const { remoteCouchDBUrl, remoteCouchDBName, collections } = config;

        for (const collectionName of collections) {
            this.setupCollectionReplication(collectionName, remoteCouchDBUrl, remoteCouchDBName);
        }
    }

    private setupCollectionReplication(
        collectionName: 'products' | 'sales' | 'settings',
        remoteUrl: string,
        remoteName: string
    ): void {
        const collection = this.db[collectionName] as unknown as SyncableCollection<never>;
        const replicationState = collection.syncCouchDB({
            remote: `${remoteUrl}/${remoteName}_${collectionName}`,
            waitForLeadership: true,
            direction: {
                pull: true,
                push: true,
            },
            options: {
                live: true,
                retry: true,
            },
            query: collection.find().where.toString(),
        } as CouchDBReplicationOptions);

        this.syncStates.set(collectionName, replicationState);

        replicationState.error$.subscribe((err: never) => {
            console.error(`Sync error in ${collectionName}:`, err);
        });

        replicationState.active$.subscribe((active: never) => {
            console.log(`Sync for ${collectionName} is ${active ? 'active' : 'inactive'}`);
        });

        console.log(`Started sync for ${collectionName}`);
    }

    public async stopSync(): Promise<void> {
        for (const [name, state] of this.syncStates) {
            await state.cancel();
            console.log(`Stopped sync for ${name}`);
        }
        this.syncStates.clear();
    }

    public getSyncState(collectionName: string): RxReplicationState | undefined {
        return this.syncStates.get(collectionName);
    }
}

export function setupReplication(
    db: BikePoSDatabase,
    config: SyncConfig
): POSReplicator {
    const replicator = new POSReplicator(db);
    replicator.startSync(config);
    return replicator;
}