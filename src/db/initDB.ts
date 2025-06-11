import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { productSchema, type ProductCollection } from './schemas/product';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';

// Initialize plugins once
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

interface BikePoSDatabase {
    products: ProductCollection;
}

let _database: Promise<BikePoSDatabase> | null = null;

export async function resetDB(): Promise<void> {
    if (_database) {
        try {
            const db = await _database;
            await db.products.close();
        } catch (error) {
            console.log('Error destroying database:', error);
        }
        _database = null;
    }

    // Clear IndexedDB
    try {
        const databases = await indexedDB.databases();
        const bikeposDb = databases.find(db => db.name === 'bikeposdb');

        if (bikeposDb) {
            return new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase('bikeposdb');
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
            });
        }
    } catch (error) {
        console.log('Error clearing IndexedDB:', error);
    }
}

export async function initDB(): Promise<BikePoSDatabase> {
    if (_database) return _database;

    _database = (async () => {
        const storage = wrappedValidateAjvStorage({
            storage: getRxStorageDexie()
        });

        const db = await createRxDatabase<BikePoSDatabase>({
            name: 'bikeposdb',
            storage,
            multiInstance: false,
            ignoreDuplicate: true // Allow during hot-reload
        });

        await db.addCollections({
            products: {
                schema: productSchema,
                migrationStrategies: {
                    1: (oldDoc) => {
                        return oldDoc; // Simple migration
                    }
                }
            }
        });

        // Cleanup on hot-reload
        if (import.meta.hot) {
            import.meta.hot.dispose(async () => {
                await db.close();
            });
        }

        return db;
    })();

    return _database;
}
