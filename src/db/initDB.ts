import { createRxDatabase, addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { productSchema, type ProductCollection } from './schemas/product.ts';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { SyncManager } from "./sync.ts";
import { WebRTCManager } from "./webrtc.ts";

// Polyfill process.nextTick for WebRTC
if (typeof window !== 'undefined' && !(window as any).process) {
    (window as any).process = {
        nextTick: (callback: () => void) => {
            setTimeout(callback, 0);
        }
    };
}

// Initialize plugins once
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBUpdatePlugin);

export type StoreId = 'store1' | 'store2';

export interface BikePoSDatabase {
    products: ProductCollection;
}

export interface RemoteStoreDatabase {
    products: ProductCollection;
}

let _localDatabase: Promise<BikePoSDatabase> | null = null;
let _remoteDatabase: Promise<RemoteStoreDatabase> | null = null;
let _currentStoreId: StoreId = 'store1';
let _webRTCManager: WebRTCManager | null = null;

export async function resetDB(): Promise<void> {
    // Reset local database
    if (_localDatabase) {
        try {
            const db = await _localDatabase;
            await db.products.close();
        } catch (error) {
            console.log('Error destroying local database:', error);
        }
        _localDatabase = null;
    }

    // Reset remote database
    if (_remoteDatabase) {
        try {
            const db = await _remoteDatabase;
            await db.products.close();
        } catch (error) {
            console.log('Error destroying remote database:', error);
        }
        _remoteDatabase = null;
    }

    // Clear WebRTC connections
    if (_webRTCManager) {
        try {
            await _webRTCManager.disconnect();
        } catch (error) {
            console.log('Error disconnecting WebRTC:', error);
        }
        _webRTCManager = null;
    }

    // Clear IndexedDB databases
    try {
        const databases = await indexedDB.databases();

        // Clear local database
        const localDb = databases.find(db => db.name === `bikepos_${_currentStoreId}`);
        if (localDb) {
            await new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(`bikepos_${_currentStoreId}`);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
            });
        }

        // Clear remote database
        const remoteStoreId = _currentStoreId === 'store1' ? 'store2' : 'store1';
        const remoteDb = databases.find(db => db.name === `bikepos_${remoteStoreId}_view`);
        if (remoteDb) {
            await new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(`bikepos_${remoteStoreId}_view`);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
            });
        }
    } catch (error) {
        console.log('Error clearing IndexedDB:', error);
    }
}

export async function initLocalDB(storeId: StoreId): Promise<BikePoSDatabase> {
    if (_localDatabase && _currentStoreId === storeId) return _localDatabase;

    // Reset if switching stores
    if (_currentStoreId !== storeId) {
        await resetDB();
    }

    _currentStoreId = storeId;

    _localDatabase = (async () => {
        const storage = wrappedValidateAjvStorage({
            storage: getRxStorageDexie()
        });

        const db = await createRxDatabase<BikePoSDatabase>({
            name: `bikepos_${storeId}`,
            storage,
            multiInstance: false,
            ignoreDuplicate: true
        });

        await db.addCollections({
            products: {
                schema: productSchema,
                migrationStrategies: {
                    1: (oldDoc) => {
                        return oldDoc;
                    }
                }
            }
        });

        // Initialize sync with CouchDB (with error handling)
        try {
            const syncManager = new SyncManager(storeId);
            await syncManager.initializeSync(db.products);
            console.log(`Sync initialized for ${storeId}`);
        } catch (error) {
            console.warn(`Sync initialization failed for ${storeId}:`, error);
            // Continue without sync if CouchDB is not available
        }

        console.log(`Local database initialized for ${storeId}`);
        return db;
    })();

    return _localDatabase;
}

export async function initRemoteDB(localStoreId: StoreId): Promise<RemoteStoreDatabase> {
    if (_remoteDatabase) return _remoteDatabase;

    const remoteStoreId = localStoreId === 'store1' ? 'store2' : 'store1';

    _remoteDatabase = (async () => {
        const storage = wrappedValidateAjvStorage({
            storage: getRxStorageDexie()
        });

        const db = await createRxDatabase<RemoteStoreDatabase>({
            name: `bikepos_${remoteStoreId}_view`,
            storage,
            multiInstance: false,
            ignoreDuplicate: true
        });

        await db.addCollections({
            products: {
                schema: productSchema,
                migrationStrategies: {
                    1: (oldDoc) => {
                        return oldDoc;
                    }
                }
            }
        });

        // Initialize sync with remote CouchDB (read-only, with error handling)
        try {
            const syncManager = new SyncManager(remoteStoreId, true);
            await syncManager.initializeSync(db.products);
            console.log(`Remote sync initialized for viewing ${remoteStoreId}`);
        } catch (error) {
            console.warn(`Remote sync initialization failed for ${remoteStoreId}:`, error);
            // Continue without sync if CouchDB is not available
        }

        console.log(`Remote database initialized for viewing ${remoteStoreId}`);
        return db;
    })();

    return _remoteDatabase;
}

export async function initWebRTCConnection(storeId: StoreId): Promise<void> {
    if (_webRTCManager) return;

    try {
        const localDb = await getLocalDB();
        const remoteDb = await getRemoteDB();

        _webRTCManager = new WebRTCManager(storeId);
        await _webRTCManager.connect(localDb.products, remoteDb.products);

        console.log(`WebRTC connection initialized for ${storeId}`);
    } catch (error) {
        console.error('Failed to initialize WebRTC connection:', error);
        // Don't throw - continue without WebRTC if it fails
    }
}

export async function initDB(storeId: StoreId = 'store1'): Promise<{
    localDb: BikePoSDatabase;
    remoteDb: RemoteStoreDatabase;
}> {
    try {
        // Initialize local database
        const localDb = await initLocalDB(storeId);

        // Initialize remote database for viewing
        const remoteDb = await initRemoteDB(storeId);

        // Initialize WebRTC connection (non-blocking)
        setTimeout(async () => {
            try {
                await initWebRTCConnection(storeId);
            } catch (error) {
                console.warn('WebRTC initialization failed:', error);
            }
        }, 1000);

        // Cleanup on hot-reload
        const isTestEnv = process.env.NODE_ENV === 'test';
        if (!isTestEnv && import.meta?.hot) {
            import.meta.hot.dispose(async () => {
                await localDb.products.close();
                await remoteDb.products.close();
                if (_webRTCManager) {
                    await _webRTCManager.disconnect();
                }
            });
        }

        return { localDb, remoteDb };
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

export const getLocalDB = async (): Promise<BikePoSDatabase> => {
    if (!_localDatabase) {
        console.log('Local database not initialized, initializing with default store...');
        const { localDb } = await initDB(_currentStoreId);
        return localDb;
    }
    return _localDatabase;
};

export const getRemoteDB = async (): Promise<RemoteStoreDatabase> => {
    if (!_remoteDatabase) {
        console.log('Remote database not initialized, initializing with default store...');
        const { remoteDb } = await initDB(_currentStoreId);
        return remoteDb;
    }
    return _remoteDatabase;
};

export const getCurrentStoreId = (): StoreId => {
    return _currentStoreId;
};

export const getOtherStoreId = (): StoreId => {
    return _currentStoreId === 'store1' ? 'store2' : 'store1';
};

export const getWebRTCManager = (): WebRTCManager | null => {
    return _webRTCManager;
};

// Legacy function for backward compatibility - now initializes if needed
export const getRxDB = async (): Promise<BikePoSDatabase> => {
    return getLocalDB();
};