import { replicateRxCollection } from 'rxdb/plugins/replication';
import type {
    RxReplicationState
} from 'rxdb/plugins/replication';
import type {ProductDocType, ProductCollection} from './schemas/product.ts';
import type {ReplicationPullHandler, ReplicationPushHandler, RxReplicationWriteToMasterRow} from "rxdb";
import {Subscription} from "rxjs";

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
    private replicationState: RxReplicationState<ProductDocType, { sequence: string }> | null = null;
    private monitoringSubscriptions: Subscription[] = [];
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

    async initializeSync(collection: ProductCollection): Promise<void> {
        try {
            if (this.replicationState) {
                await this.replicationState.cancel();
            }

            this.syncStatus.syncInProgress = true;
            this.notifyStatusChange();

            this.replicationState = replicateRxCollection({
                collection,
                replicationIdentifier: `${this.storeId}-sync-${Date.now()}`,
                pull: {
                    handler: this.pullHandler.bind(this) as unknown as ReplicationPullHandler<ProductDocType, { sequence: string }>,
                    batchSize: 10
                },
                push: {
                    handler: this.pushHandler.bind(this) as unknown as ReplicationPushHandler<ProductDocType>,
                    batchSize: 10
                },
                live: true,
                retryTime: 3000,
                autoStart: true
            });

            this.setupReplicationListeners();
            this.startLowStockMonitoring(collection);
            console.log(`Sync initialized for ${this.storeId}`);

        } catch (error) {
            console.error('Sync initialization failed:', error);
            this.handleSyncError(error as Error);
            throw error;
        } finally {
            this.syncStatus.syncInProgress = false;
            this.notifyStatusChange();
        }
    }

    private async pushHandler(
        docs: RxReplicationWriteToMasterRow<ProductDocType>[]
    ): Promise<Array<{ resolved: ProductDocType }>> {
        try {
            const couchDocs = docs.map(row => ({
                _id: row.newDocumentState.id,
                ...row.newDocumentState,
                _rev: (row.assumedMasterState as any)?._rev
            }));

            const response = await fetch(`${this.getCouchDBUrl()}/_bulk_docs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader()
                },
                body: JSON.stringify({ docs: couchDocs })
            });

            if (!response.ok) {
                throw new Error(`Push failed: ${response.status}`);
            }

            const result = await response.json();
            return result.map((item: any) => ({
                resolved: {
                    ...item,
                    id: item.id || item._id,
                    _rev: item.rev || item._rev
                }
            }));

        } catch (error) {
            console.error('Push failed:', error);
            return docs.map(doc => ({
                resolved: {
                    ...doc.newDocumentState,
                    _id: doc.newDocumentState.id,
                    _rev: (doc.assumedMasterState as any)?._rev
                }
            }));
        }
    }

    private async pullHandler(
        lastPulledCheckpoint: { sequence: string } | null
    ): Promise<{ documents: ProductDocType[]; checkpoint: { sequence: string } }> {
        try {
            const url = new URL(`${this.getCouchDBUrl()}/_changes`);
            url.searchParams.set('include_docs', 'true');
            url.searchParams.set('style', 'all_docs');
            if (lastPulledCheckpoint) {
                url.searchParams.set('since', lastPulledCheckpoint.sequence);
            }

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': this.getAuthHeader() }
            });

            if (!response.ok) {
                throw new Error(`Pull failed: ${response.status}`);
            }

            const data = await response.json();

            const documents = data.results
                .filter((r: any) => r.doc && !r.doc._id.startsWith('_design/'))
                .map((r: any) => {
                    const { _id, _rev, ...docData } = r.doc;
                    return {
                        ...docData,
                        id: _id,
                        _rev
                    } as ProductDocType;
                });

            return {
                documents,
                checkpoint: { sequence: data.last_seq }
            };
        } catch (error) {
            console.error('Pull error:', error);
            return {
                documents: [],
                checkpoint: lastPulledCheckpoint || { sequence: '0' }
            };
        }
    }

    private setupReplicationListeners(): void {
        if (!this.replicationState) return;

        this.replicationState.error$.subscribe(error => {
            console.error('Replication error:', error);
            this.handleSyncError(error);
        });

        this.replicationState.active$.subscribe(active => {
            console.log('Replication active:', active);
            this.syncStatus.syncInProgress = active;
            this.notifyStatusChange();
        });

        this.replicationState.received$.subscribe(info => {
            console.log('Documents received:', info);
            this.notifyStatusChange();
        });

        this.replicationState.sent$.subscribe(info => {
            console.log('Documents sent:', info);
            this.notifyStatusChange();
        });
    }

    private startLowStockMonitoring(collection: ProductCollection): void {
        // Monitor for low stock items
        this.monitoringSubscriptions.forEach(sub => sub.unsubscribe());
        this.monitoringSubscriptions = [];

        const sub = collection.find({
            selector: {
                [`stock.${this.storeId}`]: { $lt: 5 } // Items with stock < 5
            }
        }).$.subscribe({
            next: (docs) => {
                docs.forEach(doc => {
                    if (doc.stock[this.storeId] < 5) {
                        this.checkForStockTransfer(doc);
                    }
                });
            },
            error: (err) => {
                console.error('Low stock monitoring error:', err);
            }
        });
        this.monitoringSubscriptions.push(sub);

        // Store subscription if you need to unsubscribe later
        // this.monitoringSubscriptions.push(subscription);
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
        this.monitoringSubscriptions.forEach(sub => sub.unsubscribe());
        this.monitoringSubscriptions = [];
        this.statusCallbacks = [];
        this.stockTransferQueue = [];
    }
}