import { replicateRxCollection } from 'rxdb/plugins/replication';
// import type { ProductDocType } from './schemas/product.ts';
import type { ProductCollection } from './schemas/product';

export type StoreId = 'store1' | 'store2';

export class SyncManager {
    private replicationState: any;
    private storeId: StoreId;

    constructor(storeId: StoreId) {
        this.storeId = storeId;
    }

    private getCouchDBUrl(): string {
        const baseUrl = import.meta.env.VITE_COUCHDB_URL;
        return `${baseUrl}/bikepos_${this.storeId}`;
    }

    private getAuthHeader(): string {
        const user = import.meta.env.VITE_COUCHDB_USERNAME;
        const pass = import.meta.env.VITE_COUCHDB_PASSWORD;
        return 'Basic ' + btoa(`${user}:${pass}`);
    }

    async initializeSync(collection: ProductCollection): Promise<void> {
        if (this.replicationState) {
            await this.replicationState.cancel();
        }

        const couchUrl = this.getCouchDBUrl();
        const authHeader = this.getAuthHeader();

        this.replicationState = replicateRxCollection({
            collection,
            replicationIdentifier: `${this.storeId}-sync`,
            live: true,
            retryTime: 5000,
            pull: {
                handler: async (lastCheckpoint) => {
                    const url = new URL(`${couchUrl}/_changes`);
                    url.searchParams.set('include_docs', 'true');
                    if (lastCheckpoint) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        url.searchParams.set('since', lastCheckpoint.sequence);
                    }

                    const response = await fetch(url.toString(), {
                        headers: { 'Authorization': authHeader }
                    });

                    if (!response.ok) {
                        throw new Error(`Pull failed: ${response.status}`);
                    }

                    const data = await response.json();
                    const documents = data.results
                        .filter((r: any) => r.doc)
                        .map((r: any) => ({
                            ...r.doc,
                            id: r.doc._id,
                            _rev: r.doc._rev
                        }));

                    return {
                        documents,
                        checkpoint: { sequence: data.last_seq }
                    };
                },
                batchSize: 50,
                modifier: (doc: any) => ({
                    ...doc,
                    id: doc._id,
                    _rev: doc._rev
                })
            },
            push: {
                handler: async (docs) => {
                    const response = await fetch(`${couchUrl}/_bulk_docs`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': authHeader
                        },
                        body: JSON.stringify({ docs })
                    });

                    if (!response.ok) {
                        throw new Error(`Push failed: ${response.status}`);
                    }

                    return await response.json();
                },
                batchSize: 50,
                modifier: (doc: any) => ({
                    _id: doc.id,
                    ...doc,
                    _rev: doc._rev
                })
            }
        });

        this.replicationState.error$.subscribe((err: any) => {
            console.error('Sync error:', err);
        });

        this.replicationState.active$.subscribe((active: boolean) => {
            console.log(`Replication ${active ? 'active' : 'idle'}`);
        });
    }

    async cancel(): Promise<void> {
        if (this.replicationState) {
            await this.replicationState.cancel();
        }
    }
}