import { replicateRxCollection } from 'rxdb/plugins/replication';
import type {
    RxReplicationState
} from 'rxdb/plugins/replication';
import type { ProductDocType, ProductCollection } from './schemas/product.ts';
import type {ReplicationPullHandler, ReplicationPushHandler, RxReplicationWriteToMasterRow} from "rxdb";

export type StoreId = 'store1' | 'store2';

export interface SyncStatus {
    isOnline: boolean;
    lastSync: Date | null;
    syncInProgress: boolean;
    errors: string[];
    conflictsResolved: number;
    documentsTransferred: number;
}

export interface StockTransferRequest {
    productId: string;
    fromStore: StoreId;
    toStore: StoreId;
    quantity: number;
    reason: 'low_stock' | 'manual_transfer' | 'rebalance';
    timestamp: Date;
    status: 'pending' | 'completed' | 'failed';
}

export class SyncManager {
    private replicationState: RxReplicationState<ProductDocType, any> | null = null;
    private syncStatus: SyncStatus = {
        isOnline: navigator.onLine,
        lastSync: null,
        syncInProgress: false,
        errors: [],
        conflictsResolved: 0,
        documentsTransferred: 0
    };
    private storeId: StoreId;
    private statusCallbacks: Array<(status: SyncStatus) => void> = [];
    private stockTransferQueue: StockTransferRequest[] = [];

    constructor(storeId: StoreId) {
        this.storeId = storeId;
        this.setupNetworkListeners();
    }

    private getCouchDBUrl(): string {
        // Get from environment variables
        const baseUrl = import.meta.env.VITE_COUCHDB_URL;
        return `${baseUrl}/bikepos_${this.storeId}`;
    }
    private getAuthHeader(): string {
        const username = import.meta.env.VITE_COUCHDB_USERNAME;
        const password = import.meta.env.VITE_COUCHDB_PASSWORD;
        return 'Basic ' + btoa(`${username}:${password}`);
    }


    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.syncStatus.isOnline = true;
            this.notifyStatusChange();
            this.retryFailedSyncs();
        });

        window.addEventListener('offline', () => {
            this.syncStatus.isOnline = false;
            this.notifyStatusChange();
        });
    }

    public async initializeSync(collection: ProductCollection): Promise<void> {
        if (this.replicationState) {
            await this.replicationState.cancel();
        }

        try {
            this.syncStatus.syncInProgress = true;
            this.notifyStatusChange();

            this.replicationState = replicateRxCollection({
                collection,
                replicationIdentifier: `${this.storeId}-sync`,
                push: {
                    handler: this.pushHandler.bind(this) as unknown as ReplicationPushHandler<ProductDocType>,
                    batchSize: 10
                },
                pull: {
                    handler: this.pullHandler.bind(this) as unknown as ReplicationPullHandler<ProductDocType, any>,
                    batchSize: 50,
                    modifier: (doc) => {
                        doc._id = doc.id;
                        return doc;
                    }
                },
                live: true,
                retryTime: 5000,
                autoStart: true
            });

            this.setupReplicationListeners();
            this.startLowStockMonitoring(collection);
            console.log(`Sync initialized for ${this.storeId}`);
        } catch (error) {
            this.handleSyncError(error as Error);
        } finally {
            this.syncStatus.syncInProgress = false;
            this.notifyStatusChange();
        }
    }

    private async pushHandler(
        docs: RxReplicationWriteToMasterRow<ProductDocType>[]
    ): Promise<{ success: true } | { success: false; error: any }> {
        try {
            const response = await fetch(`${this.getCouchDBUrl()}/_bulk_docs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader()
                },
                body: JSON.stringify({
                    docs: docs.map(row => ({
                        ...row.newDocumentState,
                        // Ensure CouchDB compatible fields
                        _id: row.newDocumentState.id,
                        _rev: row.assumedMasterState?.id
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            // Parse CouchDB response to find conflicts
            const result = await response.json();
            const conflicts = result.filter((item: any) => item.error === 'conflict');

            if (conflicts.length > 0) {
                // Handle conflicts if needed
                return {
                    success: false,
                    error: new Error(`${conflicts.length} conflict(s) detected`)
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Push failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }

    private async pullHandler(
        lastPulledCheckpoint: { sequence: string } | null
    ): Promise<{
        documents: ProductDocType[];
        checkpoint: { sequence: string };
    }> {
        try {
            // 1. Prepare the URL with proper checkpoint handling
            const params = new URLSearchParams({
                include_docs: 'true',
                style: 'all_docs',
                feed: 'normal',
                heartbeat: '10000',
                ...(lastPulledCheckpoint && { since: lastPulledCheckpoint.sequence })
            });

            const url = `${this.getCouchDBUrl()}/_changes?${params.toString()}`;

            // 2. Make the authenticated request
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': this.getAuthHeader()
                }
            });

            if (!response.ok) {
                throw new Error(`Pull failed: ${response.status} ${await response.text()}`);
            }

            // 3. Process the CouchDB response
            const data = await response.json() as {
                results: Array<{ doc?: ProductDocType; seq: string }>;
                last_seq: string;
            };

            // 4. Transform documents to RxDB format
            const documents = data.results
                .filter(result => result.doc && !result.doc.id.startsWith('_design/'))
                .map(result => ({
                    ...result.doc!,
                    id: result.doc!.id, // Map _id back to id
                    _rev: result.doc!.id // Keep _rev for future updates
                }));

            // 5. Return in RxDB expected format
            return {
                documents,
                checkpoint: { sequence: data.last_seq }
            };

        } catch (error) {
            console.error('Pull error:', error);
            throw error; // RxDB will handle retries
        }
    }

    private setupReplicationListeners(): void {
        if (!this.replicationState) return;

        this.replicationState.error$.subscribe(error => {
            if (error.code === 'RC_PULL') {
                console.warn('Pull error occurred, will retry:', error.message);
            }
            // console.error('Replication error:', error);
            this.handleSyncError(error);
        });

        this.replicationState.active$.subscribe(active => {
            console.log('Replication active:', active);
            this.syncStatus.syncInProgress = active;
            this.notifyStatusChange();
        });

        this.replicationState.received$.subscribe(info => {
            console.log('Documents received:', info);
            // this.syncStatus.documentsTransferred += info.documents.length;
            this.notifyStatusChange();
        });

        this.replicationState.sent$.subscribe(info => {
            console.log('Documents sent:', info);
            // this.syncStatus.documentsTransferred += info.documents.length;
            this.notifyStatusChange();
        });
    }

    private startLowStockMonitoring(collection: ProductCollection): void {
        // Monitor for low stock items
        collection.find({
            selector: {
                [`stock.${this.storeId}`]: { $lt: 5 }
            }
        }).$.subscribe(docs => {
            docs.forEach(doc => {
                this.checkForStockTransfer(doc);
            });
        });
    }

    private checkForStockTransfer(product: ProductDocType): void {
        const currentStock = product.stock[this.storeId] || 0;
        const otherStore: StoreId = this.storeId === 'store1' ? 'store2' : 'store1';
        const otherStoreStock = product.stock[otherStore] || 0;

        // If current store is low and other store has excess
        if (currentStock < 5 && otherStoreStock > 10) {
            const transferRequest: StockTransferRequest = {
                productId: product.id,
                fromStore: otherStore,
                toStore: this.storeId,
                quantity: Math.min(5, otherStoreStock - 5),
                reason: 'low_stock',
                timestamp: new Date(),
                status: 'pending'
            };

            this.queueStockTransfer(transferRequest);
        }
    }

    private queueStockTransfer(request: StockTransferRequest): void {
        // Avoid duplicate transfers
        const existingTransfer = this.stockTransferQueue.find(
            transfer => transfer.productId === request.productId &&
                transfer.status === 'pending'
        );

        if (!existingTransfer) {
            this.stockTransferQueue.push(request);
            console.log('Queued stock transfer:', request);
        }
    }

    public async processStockTransfers(): Promise<void> {
        const pendingTransfers = this.stockTransferQueue.filter(
            transfer => transfer.status === 'pending'
        );

        for (const transfer of pendingTransfers) {
            try {
                // Here you would implement the actual stock transfer logic
                // This might involve updating the product documents
                console.log('Processing stock transfer:', transfer);

                transfer.status = 'completed';
                this.syncStatus.lastSync = new Date();
            } catch (error) {
                console.error('Stock transfer failed:', error);
                transfer.status = 'failed';
            }
        }

        this.notifyStatusChange();
    }

    private handleSyncError(error: Error): void {
        console.error('Sync error:', error);
        this.syncStatus.errors.push(error.message);
        this.notifyStatusChange();
    }

    private retryFailedSyncs(): void {
        if (this.replicationState && this.syncStatus.isOnline) {
            console.log('Retrying failed syncs...');
            // RxDB replication will automatically retry when online
        }
    }

    public onStatusChange(callback: (status: SyncStatus) => void): void {
        this.statusCallbacks.push(callback);
    }

    private notifyStatusChange(): void {
        this.statusCallbacks.forEach(callback => callback(this.syncStatus));
    }

    public getStatus(): SyncStatus {
        return { ...this.syncStatus };
    }

    public async destroy(): Promise<void> {
        if (this.replicationState) {
            await this.replicationState.cancel();
            this.replicationState = null;
        }
        this.statusCallbacks = [];
        this.stockTransferQueue = [];
    }
}