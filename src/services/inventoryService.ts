import { ProductRepository } from '../db/repositories/productRepository';
import type {ProductDocType} from '../db/schemas/product';
import { validateProduct, type ValidationError } from '../utils/validation';
import {getRxDB} from "../db/initDB.ts";

export class InventoryService {
    private productRepository: ProductRepository
    constructor(productRepository: ProductRepository) {
        this.productRepository = productRepository;
    }

    static async addProduct(productData: Omit<ProductDocType, 'id'>): Promise<{ success: boolean; product?: any; errors?: ValidationError[] }> {
        const errors = validateProduct(productData);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        try {
            const db = await getRxDB();
            const newProduct = {
                ...productData,
                id: `prod_${Date.now()}`, // Generate unique ID
                stock: {
                    store1: Number(productData.stock.store1) || 0,
                    store2: Number(productData.stock.store2) || 0
                }
            };

            await db.products.insert(newProduct);
            return { success: true };
        } catch (error) {
            console.error("Error adding product: ", error)
            return { success: false, errors: [{ field: 'general', message: 'Failed to create product' }] };
        }
    }

    async updateProduct(productId: string, store: 'store1' | 'store2', quantity: number): Promise<boolean> {
        try {
            const db = await getRxDB();
            const product = await db.products.findOne(productId).exec();

            if (product) {
                await product.update({
                    $set: {
                        [`stock.${store}`]: Number(quantity)
                    }
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating stock:', error);
            return false;
        }
    }

    async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
        try {
            // Safety check: ensure product exists and has no pending sales
            const product = await this.productRepository.getProductById(id);
            if (!product) {
                return { success: false, message: 'Product not found' };
            }

            // Add additional safety checks here (e.g., check for pending orders)

            const deleted = await this.productRepository.deleteProduct(id);
            return {
                success: deleted,
                message: deleted ? 'Product deleted successfully' : 'Failed to delete product'
            };
        } catch (error) {
            return { success: false, message: 'Error deleting product' };
        }
    }

    async transferStock(productId: string, fromStore: 'store1' | 'store2', toStore: 'store1' | 'store2', quantity: number): Promise<{ success: boolean; message: string }> {
        if (quantity <= 0) {
            return { success: false, message: 'Transfer quantity must be positive' };
        }

        if (fromStore === toStore) {
            return { success: false, message: 'Cannot transfer to the same store' };
        }

        try {
            const success = await this.productRepository.transferStock(productId, fromStore, toStore, quantity);
            return {
                success,
                message: success ? 'Stock transferred successfully' : 'Insufficient stock or product not found'
            };
        } catch (error) {
            return { success: false, message: 'Error transferring stock' };
        }
    }

    async getLowStockAlerts(threshold: number = 5) {
        return await this.productRepository.getLowStockProducts(threshold);
    }

    async searchProducts(query: string, category?: string) {
        if (category) {
            const categoryProducts = await this.productRepository.getProductsByCategory(category);
            if (!query) return categoryProducts;

            return categoryProducts.filter(product =>
                product.get('name').en.toLowerCase().includes(query.toLowerCase()) ||
                product.get('name').si.toLowerCase().includes(query.toLowerCase()) ||
                (product.get('barcode') && product.get('barcode').toLowerCase().includes(query.toLowerCase()))
            );
        }

        if (!query) {
            return await this.productRepository.getAllProducts();
        }

        return await this.productRepository.searchProducts(query);
    }
}