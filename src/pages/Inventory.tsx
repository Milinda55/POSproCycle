// import { getDB } from '../db/initDB';
//
// export async function transferStock(
//     itemId: string,
//     fromStore: string,
//     toStore: string,
//     qty: number
// ): Promise<void> {
//     const db = await getDB();
//
//     await db.inventory
//         .findOne({ selector: { id: itemId, storeId: fromStore } })
//         ?.update({ $inc: { quantity: -qty } });
//
//     await db.inventory
//         .findOne({ selector: { id: itemId, storeId: toStore } })
//         ?.update({ $inc: { quantity: qty } });
// }
