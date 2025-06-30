import type {RxDocument} from 'rxdb';
import type {ProductDocType} from '../schemas/product';
import type {BikePoSDatabase} from "../initDB.ts";

export class ProductRepository {
    private readonly dbPromise: () => Promise<BikePoSDatabase>

    constructor(dbGetter: () => Promise<BikePoSDatabase>) {
        this.dbPromise = dbGetter;
    }

    async getAllProducts(): Promise<RxDocument<ProductDocType>[]> {
        // return await this.db.products.find().exec();
        const db = await this.dbPromise();
        return db.products.find().exec();
    }

    async getProductById(id: string): Promise<RxDocument<ProductDocType> | null> {
        const db = await this.dbPromise();
        return db.products.findOne(id).exec();
    }

    async createProduct(productData: Omit<ProductDocType, 'id'>): Promise<RxDocument<ProductDocType>> {
        const id = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const db = await this.dbPromise();
        return db.products.insert({
            id,
            ...productData,
            stock: productData.stock || { store1: 0, store2: 0 }
        });
    }

    async updateProduct(id: string, updates: Partial<ProductDocType>): Promise<RxDocument<ProductDocType> | null> {
        const product = await this.getProductById(id);
        if (!product) return null;

        return await product.update({
            $set: updates
        });
    }

    async deleteProduct(id: string): Promise<boolean> {
        const product = await this.getProductById(id);
        if (!product) return false;

        await product.remove();
        return true;
    }

    // In productRepository.ts, modify your debugDatabase method:
    async debugDatabase(): Promise<void> {
        const db = await this.dbPromise();

        const allProducts = await db.products.find().exec();
        console.log('Total products in DB:', allProducts.length);

        if (allProducts.length > 0) {
            console.log('All products:', allProducts.map(doc => doc.toJSON()));
            console.log('First product barcode:', allProducts[0].get('barcode'));
            console.log('Available barcodes:', allProducts.map(doc => doc.get('barcode')));
        } else {
            console.log('No products found in database!');
        }
    }

    async searchProducts(query: string): Promise<RxDocument<ProductDocType>[]> {
        const db = await this.dbPromise();

        // Debug: log what we're searching for
        console.log('Searching for:', query);

        // Try simple barcode match
        const result = await db.products.find({
            selector: {
                barcode: query
            }
        }).exec();

        console.log('Found documents:', result.map(doc => doc.toJSON()));
        return result;
    }


    async getProductsByCategory(category: string): Promise<RxDocument<ProductDocType>[]> {
        const db = await this.dbPromise();
        return db.products.find({
            selector: { category }
        }).exec();
    }

    async getLowStockProducts(threshold: number = 5): Promise<RxDocument<ProductDocType>[]> {
        const db = await this.dbPromise();
        return db.products.find({
            selector: {
                $or: [
                    { 'stock.store1': { $lt: threshold } },
                    { 'stock.store2': { $lt: threshold } }
                ]
            }
        }).exec();
    }


    async updateStock(productId: string, store: 'store1' | 'store2', quantity: number): Promise<boolean> {
        const product = await this.getProductById(productId);
        if (!product) return false;

        const currentStock = product.get('stock');
        await product.update({
            $set: {
                stock: {
                    ...currentStock,
                    [store]: quantity
                }
            }
        });
        return true;
    }

    async transferStock(productId: string, fromStore: 'store1' | 'store2', toStore: 'store1' | 'store2', quantity: number): Promise<boolean> {
        const product = await this.getProductById(productId);
        if (!product) return false;

        const currentStock = product.get('stock');
        if (currentStock[fromStore] < quantity) return false;

        await product.update({
            $set: {
                stock: {
                    ...currentStock,
                    [fromStore]: currentStock[fromStore] - quantity,
                    [toStore]: currentStock[toStore] + quantity
                }
            }
        });
        return true;
    }
}