// import { addRxPlugin, type RxDatabase } from 'rxdb';
// import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
// import { createRxDatabase } from 'rxdb/plugins/core';
// import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
//
// // Import schemas
// import { productSchema, type ProductCollection } from './schemas/product';
// import { saleSchema, type SaleCollection } from './schemas/sale';
// import { settingsSchema, type SettingsCollection } from './schemas/settings';
//
// // Add dev mode plugin only in development
// if (import.meta.env.DEV) {
//     addRxPlugin(RxDBDevModePlugin);
// }
// // Database type
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-expect-error
// export interface BikePoSDatabase extends RxDatabase {
//     products: ProductCollection;
//     sales: SaleCollection;
//     settings: SettingsCollection;
// }
//
// let dbInstance: BikePoSDatabase | null = null;
//
// export async function initDB(): Promise<BikePoSDatabase> {
//     if (dbInstance) {
//         return dbInstance;
//     }
//
//     console.log('Initializing database...');
//
//     try {
//         const db = await createRxDatabase<BikePoSDatabase>({
//             name: 'bikeposdb',
//             storage: getRxStorageDexie(),
//             multiInstance: true,
//             eventReduce: true,
//             ignoreDuplicate: true,
//         });
//
//         console.log('Database created, adding collections...');
//
//         await db.addCollections({
//             products: {
//                 schema: productSchema,
//             },
//             sales: {
//                 schema: saleSchema,
//             },
//             settings: {
//                 schema: settingsSchema,
//             },
//         });
//
//         console.log('Collections added successfully');
//
//         dbInstance = db;
//         return db;
//     } catch (error) {
//         console.error('Failed to initialize database:', error);
//         throw error;
//     }
// }
//
// export async function getDB(): Promise<BikePoSDatabase> {
//     if (!dbInstance) {
//         return await initDB();
//     }
//     return dbInstance;
// }