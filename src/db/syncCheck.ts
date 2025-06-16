
import { initDB } from './initDB.ts';
import { SyncManager } from './sync.ts';
import { isRxCollection } from 'rxdb';

async function main() {
    const db = await initDB();

    if (!isRxCollection(db.products)) {
        throw new Error('products collection not initialized');
    }

    const sync = new SyncManager('store1');
    sync.onStatusChange((status) => {
        console.log('SYNC STATUS:', status);
    });

    await sync.initializeSync(db.products);

    // Add a sample doc to simulate a push
    const doc = await db.products.insert({
        id: 'verify-' + Date.now(),
        name: { en: 'Verification Product', si: 'සත්‍යාපන භාණ්ඩ' },
        price: 100,
        quantity: 1,
        stock: { store1: 3, store2: 8 }
    });

    console.log('Inserted document:', doc.toJSON());

    // Let sync run for a few seconds
    setTimeout(() => {
        console.log('Exiting after sync...');
        process.exit(0);
    }, 10000);
}

main().catch(err => console.error('Sync test error:', err));
