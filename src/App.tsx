import './App.css'
// For testing only - remove later
import {getRxDB, initDB} from './db/initDB.ts';
(window as any).initDB = initDB;

import { SyncManager } from './db/sync.ts';
import {useEffect, useState} from "react";
import {initTestingHelpers} from "./utils/testingHelpers.ts";
import {AddProductForm} from "./components/inventory/AddProductForm.tsx";
import {InventoryService} from "./services/inventoryService.ts";

(window as any).SyncManager = SyncManager;

function App() {

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            initTestingHelpers();
        }
    }, []);

    const [syncManagers, setSyncManagers] = useState<SyncManager[]>([]);

    // Initialize sync for both stores
    useEffect(() => {
        const initSync = async () => {
            const db = await getRxDB();
            const manager1 = new SyncManager('store1');
            const manager2 = new SyncManager('store2');

            await manager1.initializeSync(db.products);
            await manager2.initializeSync(db.products);

            setSyncManagers([manager1, manager2]);
        };

        initSync();
    }, []);

    return (
        <>
            <div>
                <h1 className="bg-green-300">POS System Test</h1>
                <AddProductForm
                    onSubmit={InventoryService.addProduct}
                    onCancel={() => console.log('Cancelled')}
                />
            </div>
        </>
    );
}

export default App
