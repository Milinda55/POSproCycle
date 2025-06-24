import { useState } from 'react';
import { initDB, resetDB } from './initDB.ts';

export default function DBTest() {
    const [status, setStatus] = useState('Ready...');

    const clearDatabase = async () => {
        try {
            setStatus('Clearing database...');
            await resetDB();
            setStatus('Database cleared! You can now test insert/query.');
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setStatus('Clear error: ' + error.message);
            console.log(error);
        }
    };

    const testInsert = async () => {
        try {
            const db = await initDB();
            await db.products.insert({
                id: 'prod_' + Date.now(),
                name: { en: 'Test', si: 'පරීක්ෂණ' },
                price: 10,
                quantity: 5,
                stock: { store1: 3, store2: 2},
                minStock: 5,
                category: 'Test Category',
                barcode: 'TEST1234'
            });
            setStatus('Insert successful!');
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setStatus('Error: ' + error.message);
            console.log(error);
        }
    };

    const testQuery = async () => {
        try {
            const db = await initDB();
            const products = await db.products.find().exec();
            console.log('Products:', products.map(p => p.toJSON()));
            setStatus(`Found ${products.length} products`);
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setStatus('Query failed: ' + error.message);
            console.error(error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Database Test</h1>
            <div>{status}</div>
            <div className="flex flex-col bg-amber-200 gap-2">
                <button onClick={clearDatabase} style={{ backgroundColor: '#ff6b6b', color: 'white' }}>
                    Clear Database (Fix Schema Error)
                </button>
                <button onClick={testInsert}>Test Insert</button>
                <button onClick={testQuery}>Test Query</button>
            </div>
        </div>
    );
}
