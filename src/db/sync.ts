
import {replicateRxCollection, RxReplicationState} from 'rxdb/plugins/replication';
import type {ProductDocType} from "./schemas/product.ts";

export type StoreId = 'store1' | 'store2';

export class SyncManager {
    private replicationState: RxReplicationState<ProductDocType, any> | null = null;
    private storeId: StoreId;

    constructor(storeId: StoreId) {
        this.storeId = storeId;
    }

    private getCouchDBUrl(): string {
        return `${import.meta.env.VITE_COUCHDB_URL}/bikepos_${this.storeId}`;
    }

    private getAuthHeader(): string {
        return 'Basic ' + btoa(`${import.meta.env.VITE_COUCHDB_USERNAME}:${import.meta.env.VITE_COUCHDB_PASSWORD}`);
    }

    async initializeSync(collection: any): Promise<void> {
        const couchUrl = this.getCouchDBUrl();
        const authHeader = this.getAuthHeader();

        this.replicationState = replicateRxCollection({
            collection,
            replicationIdentifier: `${this.storeId}-sync`,
            pull: {
                async handler(lastCheckpoint: any) {
                    const url = new URL(`${couchUrl}/_changes`);
                    url.searchParams.set('include_docs', 'true');
                    if (lastCheckpoint) {
                        url.searchParams.set('since', lastCheckpoint.sequence);
                    }

                    const response = await fetch(url.toString(), {
                        headers: { 'Authorization': authHeader }
                    });
                    const data = await response.json();

                    return {
                        documents: data.results
                            .filter((r: any) => r.doc)
                            .map((r: any) => ({
                                ...r.doc,
                                id: r.doc._id,
                                _rev: r.doc._rev
                            })),
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

                    const response = await fetch(`${couchUrl}/_bulk_docs`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': authHeader
                        },
                        body: JSON.stringify({ docs })
                    });

                    return await response.json();
                }
            },
            live: true,
            retryTime: 1000
        });
    }
}