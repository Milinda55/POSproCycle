import { replicateRxCollection, RxReplicationState } from 'rxdb/plugins/replication';
import type { ProductDocType } from './schemas/product.ts';
import type { ProductCollection } from './schemas/product.ts';

export type StoreId = 'store1' | 'store2';

export class SyncManager {
    private replicationState: RxReplicationState<ProductDocType, any> | null = null;
    private storeId: StoreId;
    private isReadOnly: boolean;

    constructor(storeId: StoreId, isReadOnly: boolean = false) {
        this.storeId = storeId;
        this.isReadOnly = isReadOnly;
    }

    private getCouchDBUrl(): string {
        const baseUrl = import.meta.env.VITE_COUCHDB_URL || 'http://localhost:5984';
        return `${baseUrl}/bikepos_${this.storeId}/`;
    }

    private getAuthHeader(): string {
        const user = import.meta.env.VITE_COUCHDB_USERNAME || 'admin';
        const pass = import.meta.env.VITE_COUCHDB_PASSWORD || 'password';
        return 'Basic ' + btoa(`${user}:${pass}`);
    }

    async initializeSync(collection: ProductCollection): Promise<void> {
        if (this.replicationState) {
            await this.replicationState.cancel();
        }

        const couchUrl = this.getCouchDBUrl();
        const authHeader = this.getAuthHeader();

        try {
            const replicationConfig: any = {
                collection,
                replicationIdentifier: `${this.storeId}-sync${this.isReadOnly ? '-readonly' : ''}`,
                live: true,
                retryTime: 5000,
                pull: {
                    async handler(lastCheckpoint: any) {
                        try {
                            const url = new URL(`${couchUrl}_changes`);
                            url.searchParams.set('include_docs', 'true');
                            if (lastCheckpoint) {
                                url.searchParams.set('since', lastCheckpoint.sequence);
                            }

                            const response = await fetch(url.toString(), {
                                headers: { 'Authorization': authHeader }
                            });

                            if (!response.ok) {
                                console.warn(`CouchDB Pull Failed for ${this.storeId}:`, response.status);
                                return { documents: [], checkpoint: lastCheckpoint };
                            }

                            const data = await response.json();
                            const documents = (data.results || [])
                                .filter((r: any) => r.doc && !r.doc._deleted)
                                .map((r: any) => ({
                                    ...r.doc,
                                    id: r.doc._id,
                                    _rev: r.doc._rev
                                }));

                            return {
                                documents,
                                checkpoint: { sequence: data.last_seq }
                            };
                        } catch (error) {
                            console.warn(`Pull error for ${this.storeId}:`, error);
                            return { documents: [], checkpoint: lastCheckpoint };
                        }
                    }
                }
            };

            // Only add push handler if not read-only
            if (!this.isReadOnly) {
                replicationConfig.push = {
                    async handler(rows: any) {
                        try {
                            const docs = rows.map((row: any) => ({
                                ...row.newDocumentState
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
                                console.warn(`CouchDB Push Failed for ${this.storeId}:`, response.status);
                                return [];
                            }

                            return await response.json();
                        } catch (error) {
                            console.warn(`Push error for ${this.storeId}:`, error);
                            return [];
                        }
                    }
                };
            }

            this.replicationState = replicateRxCollection(replicationConfig);

            this.replicationState.error$.subscribe((err: any) => {
                console.warn(`Sync error (${this.storeId}${this.isReadOnly ? ' readonly' : ''}):`, err);
            });

            this.replicationState.active$.subscribe((active: boolean) => {
                console.log(`Replication ${this.storeId}${this.isReadOnly ? ' (readonly)' : ''} ${active ? 'active' : 'idle'}`);
            });

        } catch (error) {
            console.error(`Failed to initialize sync for ${this.storeId}:`, error);
            throw error;
        }
    }

    async cancel(): Promise<void> {
        if (this.replicationState) {
            await this.replicationState.cancel();
        }
    }
}