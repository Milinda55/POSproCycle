// import { SyncManager } from './sync';
// import { initDB, resetDB } from './initDB';
// import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect } from '@jest/globals';
// jest.mock('rxdb/plugins/replication');
//
// describe('SyncManager', () => {
//     let db: any; // Replace it with your actual DB type
//     let syncManager: SyncManager;
//
//     beforeAll(async () => {
//         await resetDB();
//         db = await initDB();
//     });
//
//     beforeEach(() => {
//         syncManager = new SyncManager('store1');
//     });
//
//     afterEach(async () => {
//         await syncManager.destroy();
//     });
//
//     afterAll(async () => {
//         await db.products.database.close();
//     });
//
//     test('should initialize successfully', () => {
//         expect(syncManager).toBeInstanceOf(SyncManager);
//     });
//
//     test('should detect online/offline status', () => {
//         // Mock online/offline events
//         window.dispatchEvent(new Event('offline'));
//         expect(syncManager.getStatus().isOnline).toBe(false);
//
//         window.dispatchEvent(new Event('online'));
//         expect(syncManager.getStatus().isOnline).toBe(true);
//     });
//
//     test('should queue stock transfers when stock is low', async () => {
//         // Add test product with low stock
//         await db.products.insert({
//             id: 'test-product-1',
//             name: { en: 'Test Product', si: 'පරීක්ෂණ භාණ්ඩ' },
//             price: 100,
//             quantity: 1,
//             stock: { store1: 2, store2: 10 } // Low in store1
//         });
//
//         // Wait for detection
//         await new Promise(resolve => setTimeout(resolve, 500));
//
//         // Verify transfer was queued (access private queue for testing)
//         const queue = (syncManager as any).stockTransferQueue;
//         expect(queue.length).toBeGreaterThan(0);
//         expect(queue[0].productId).toBe('test-product-1');
//     });
// });
//
