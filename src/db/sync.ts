import { replicateRxCollection, RxReplicationState } from 'rxdb/plugins/replication';
import type { ProductDocType } from './schemas/product.ts';
import type { ProductCollection } from './schemas/product.ts';

export type StoreId = 'store1' | 'store2';

export class SyncManager {
    private replicationState: RxReplicationState<ProductDocType, any> | null = null;
    private storeId: StoreId;

    constructor(storeId: StoreId) {
        this.storeId = storeId;
    }

    private getCouchDBUrl(): string {
        const baseUrl = import.meta.env.VITE_COUCHDB_URL;
        return `${baseUrl}/bikepos_${this.storeId}/`; // Ensure trailing slash
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
                async handler(lastCheckpoint: any) {
                    const url = new URL(`${couchUrl}_changes`);
                    url.searchParams.set('include_docs', 'true');
                    if (lastCheckpoint) {
                        url.searchParams.set('since', lastCheckpoint.sequence);
                    }

                    const response = await fetch(url.toString(), {
                        headers: { 'Authorization': authHeader }
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        // console.error('CouchDB Pull Failed:', response.status, errorText);
                        throw new Error('Pull replication failed');
                    }

                    const data = await response.json();
                    const documents = (data.results || [])
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
                }
            },
            push: {
                async handler(rows: any) {
                    const docs = rows.map((row: any) => ({
                        _id: row.newDocumentState.id,
                        ...row.newDocumentState,
                        _rev: row.assumedMasterState?._rev
                    }));

                    const response = await fetch(`${couchUrl}_bulk_docs`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': authHeader
                        },
                        body: JSON.stringify({ docs })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        // console.error('CouchDB Push Failed:', response.status, errorText);
                        throw new Error('Push replication failed');
                    }

                    return await response.json();
                }
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
