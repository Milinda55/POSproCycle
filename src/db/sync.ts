// import { replicateRxCollection } from 'rxdb/plugins/replication';
// import type {
//     RxReplicationState
// } from 'rxdb/plugins/replication';
// import type { ProductDocType, ProductCollection } from './schemas/product.ts';
// import type {ReplicationPullHandler, ReplicationPushHandler, RxReplicationWriteToMasterRow} from "rxdb";
//
// export type StoreId = 'store1' | 'store2';
//
// export interface SyncStatus {
//     isOnline: boolean;
//     lastSync: Date | null;
//     syncInProgress: boolean;
//     errors: string[];
//     conflictsResolved: number;
//     documentsTransferred: number;
// }
//
// export interface StockTransferRequest {
//     productId: string;
//     fromStore: StoreId;
//     toStore: StoreId;
//     quantity: number;
//     reason: 'low_stock' | 'manual_transfer' | 'rebalance';
//     timestamp: Date;
//     status: 'pending' | 'completed' | 'failed';
// }
//
// export class SyncManager {
//     private replicationState: RxReplicationState<ProductDocType, any> | null = null;
//     private syncStatus: SyncStatus = {
//         isOnline: navigator.onLine,
//         lastSync: null,
//         syncInProgress: false,
//         errors: [],
//         conflictsResolved: 0,
//         documentsTransferred: 0
//     };
//     private storeId: StoreId;
//     private statusCallbacks: Array<(status: SyncStatus) => void> = [];
//     private stockTransferQueue: StockTransferRequest[] = [];
//
//     constructor(storeId: StoreId) {
//         this.storeId = storeId;
//         this.setupNetworkListeners();
//     }
//
//     private setupNetworkListeners(): void {
//         window.addEventListener('online', () => {
//             this.syncStatus.isOnline = true;
//             this.notifyStatusChange();
//             this.retryFailedSyncs();
//         });
//
//         window.addEventListener('offline', () => {
//             this.syncStatus.isOnline = false;
//             this.notifyStatusChange();
//         });
//     }
//
//     public async initializeSync(collection: ProductCollection): Promise<void> {
//         if (this.replicationState) {
//             await this.replicationState.cancel();
//         }
//
//         try {
//             this.syncStatus.syncInProgress = true;
//             this.notifyStatusChange();
//
//             this.replicationState = replicateRxCollection({
//                 collection,
//                 replicationIdentifier: `${this.storeId}-sync`,
//                 retryTime: 5000,
//                 waitForLeadership: false,
//                 push: {
//                     handler: this.pushHandler.bind(this) as unknown as ReplicationPushHandler<ProductDocType>,
//                     batchSize: 10
//                 },
//                 pull: {
//                     handler: this.pullHandler.bind(this) as unknown as ReplicationPullHandler<ProductDocType, any>,
//                     batchSize: 10
//                 }
//             });
//
//             this.setupReplicationListeners();
//             this.startLowStockMonitoring(collection);
//             console.log(`Sync initialized for ${this.storeId}`);
//         } catch (error) {
//             this.handleSyncError(error as Error);
//         } finally {
//             this.syncStatus.syncInProgress = false;
//             this.notifyStatusChange();
//         }
//     }
//
//     // Fix: Use a correct parameter type for push handler
//     private async pushHandler(docs: RxReplicationWriteToMasterRow<ProductDocType>[]): Promise<boolean> {
//         try {
//             console.log(`Pushing ${docs.length} documents from ${this.storeId}:`, docs);
//
//             // Extract the actual document data from the replication rows
//             const docData = docs.map(row => row.newDocumentState);
//
//             // Here you would typically send to your backend
//             // For now, we'll just simulate a successful push
//             console.log('Document data to push:', docData);
//
//             this.syncStatus.documentsTransferred += docs.length;
//             this.syncStatus.lastSync = new Date();
//             this.notifyStatusChange();
//             return true;
//         } catch (error) {
//             console.error('Push failed:', error);
//             this.handleSyncError(error as Error);
//             return false;
//         }
//     }
//
//     // Fix: Add the missing pull handler with correct return type
//     private async pullHandler(
//         lastPulledCheckpoint: any,
//         // batchSize: number
//     ): Promise<{ documents: ProductDocType[]; checkpoint: any }> {
//         try {
//             console.log(`Pulling documents for ${this.storeId}, checkpoint:`, lastPulledCheckpoint);
//
//             // Here you would typically fetch from your backend
//             // For now, return empty result
//             const result = {
//                 documents: [] as ProductDocType[],
//                 checkpoint: lastPulledCheckpoint || null
//             };
//
//             if (result.documents.length > 0) {
//                 this.syncStatus.documentsTransferred += result.documents.length;
//                 this.syncStatus.lastSync = new Date();
//                 this.notifyStatusChange();
//             }
//
//             return result;
//         } catch (error) {
//             console.error('Pull failed:', error);
//             this.handleSyncError(error as Error);
//             throw error;
//         }
//     }
//
//     private setupReplicationListeners(): void {
//         if (!this.replicationState) return;
//
//         this.replicationState.error$.subscribe(error => {
//             console.error('Replication error:', error);
//             this.handleSyncError(error);
//         });
//
//         this.replicationState.active$.subscribe(active => {
//             console.log('Replication active:', active);
//             this.syncStatus.syncInProgress = active;
//             this.notifyStatusChange();
//         });
//
//         this.replicationState.received$.subscribe(info => {
//             console.log('Documents received:', info);
//             // this.syncStatus.documentsTransferred += info.documents.length;
//             this.notifyStatusChange();
//         });
//
//         this.replicationState.sent$.subscribe(info => {
//             console.log('Documents sent:', info);
//             // this.syncStatus.documentsTransferred += info.documents.length;
//             this.notifyStatusChange();
//         });
//     }
//
//     private startLowStockMonitoring(collection: ProductCollection): void {
//         // Monitor for low stock items
//         collection.find({
//             selector: {
//                 [`stock.${this.storeId}`]: { $lt: 5 }
//             }
//         }).$.subscribe(docs => {
//             docs.forEach(doc => {
//                 this.checkForStockTransfer(doc);
//             });
//         });
//     }
//
//     private checkForStockTransfer(product: ProductDocType): void {
//         const currentStock = product.stock[this.storeId] || 0;
//         const otherStore: StoreId = this.storeId === 'store1' ? 'store2' : 'store1';
//         const otherStoreStock = product.stock[otherStore] || 0;
//
//         // If current store is low and other store has excess
//         if (currentStock < 5 && otherStoreStock > 10) {
//             const transferRequest: StockTransferRequest = {
//                 productId: product.id,
//                 fromStore: otherStore,
//                 toStore: this.storeId,
//                 quantity: Math.min(5, otherStoreStock - 5),
//                 reason: 'low_stock',
//                 timestamp: new Date(),
//                 status: 'pending'
//             };
//
//             this.queueStockTransfer(transferRequest);
//         }
//     }
//
//     private queueStockTransfer(request: StockTransferRequest): void {
//         // Avoid duplicate transfers
//         const existingTransfer = this.stockTransferQueue.find(
//             transfer => transfer.productId === request.productId &&
//                 transfer.status === 'pending'
//         );
//
//         if (!existingTransfer) {
//             this.stockTransferQueue.push(request);
//             console.log('Queued stock transfer:', request);
//         }
//     }
//
//     public async processStockTransfers(): Promise<void> {
//         const pendingTransfers = this.stockTransferQueue.filter(
//             transfer => transfer.status === 'pending'
//         );
//
//         for (const transfer of pendingTransfers) {
//             try {
//                 // Here you would implement the actual stock transfer logic
//                 // This might involve updating the product documents
//                 console.log('Processing stock transfer:', transfer);
//
//                 transfer.status = 'completed';
//                 this.syncStatus.lastSync = new Date();
//             } catch (error) {
//                 console.error('Stock transfer failed:', error);
//                 transfer.status = 'failed';
//             }
//         }
//
//         this.notifyStatusChange();
//     }
//
//     private handleSyncError(error: Error): void {
//         console.error('Sync error:', error);
//         this.syncStatus.errors.push(error.message);
//         this.notifyStatusChange();
//     }
//
//     private retryFailedSyncs(): void {
//         if (this.replicationState && this.syncStatus.isOnline) {
//             console.log('Retrying failed syncs...');
//             // RxDB replication will automatically retry when online
//         }
//     }
//
//     public onStatusChange(callback: (status: SyncStatus) => void): void {
//         this.statusCallbacks.push(callback);
//     }
//
//     private notifyStatusChange(): void {
//         this.statusCallbacks.forEach(callback => callback(this.syncStatus));
//     }
//
//     public getStatus(): SyncStatus {
//         return { ...this.syncStatus };
//     }
//
//     public async destroy(): Promise<void> {
//         if (this.replicationState) {
//             await this.replicationState.cancel();
//             this.replicationState = null;
//         }
//         this.statusCallbacks = [];
//         this.stockTransferQueue = [];
//     }
// }