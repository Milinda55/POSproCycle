import { ProductRepository } from '../db/repositories/productRepository';
import type { ProductDocType } from '../db/schemas/product';
import { validateProduct, type ValidationError } from '../utils/validation';
import {
    getLocalDB,
    getRemoteDB,
    getCurrentStoreId,
    getOtherStoreId,
    getWebRTCManager,
    type StoreId
} from "../db/initDB.ts";

export class InventoryService {
    private productRepository: ProductRepository;
    private currentStoreId: StoreId;

    constructor(productRepository: ProductRepository) {
        this.productRepository = productRepository;
        this.currentStoreId = getCurrentStoreId();
    }

    // Local store operations (editable)
    async addProduct(productData: Omit<ProductDocType, 'id'>): Promise<{ success: boolean; product?: any; errors?: ValidationError[] }> {
        const errors = validateProduct(productData);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        try {
            const db = await getLocalDB();
            const newProduct = {
                ...productData,
                id: `prod_${Date.now()}_${this.currentStoreId}`, // Include store ID for uniqueness
                stock: {
                    store1: Number(productData.stock.store1) || 0,
                    store2: Number(productData.stock.store2) || 0
                }
            };

            await db.products.insert(newProduct);
            console.log(`Product added to local store (${this.currentStoreId}):`, newProduct.id);
            return { success: true, product: newProduct };
        } catch (error) {
            console.error("Error adding product: ", error);
            return { success: false, errors: [{ field: 'general', message: 'Failed to create product' }] };
        }
    }

    async updateProduct(
        productId: string,
        updateData: Partial<ProductDocType>
    ): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const db = await getLocalDB();
            const product = await db.products.findOne(productId).exec();

            if (!product) {
                return { success: false, errors: ['Product not found in local store'] };
            }

            // Create the update object
            const updateObj: any = {};

            // Handle nested fields
            if (updateData.name) {
                updateObj['name'] = updateData.name;
            }
            if (updateData.stock) {
                updateObj['stock'] = updateData.stock;
            }

            // Handle simple fields
            const simpleFields = ['price', 'quantity', 'category', 'barcode', 'minStock'];
            simpleFields.forEach(field => {
                if (field in updateData) {
                    updateObj[field] = (updateData as any)[field];
                }
            });

            // Perform the update
            await product.update({
                $set: updateObj
            });

            console.log(`Product updated in local store (${this.currentStoreId}):`, productId);
            return { success: true };
        } catch (error) {
            console.error('Update error:', error);
            return {
                success: false,
                errors: ['Failed to update product']
            };
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
            if (deleted) {
                console.log(`Product deleted from local store (${this.currentStoreId}):`, id);
            }
            return {
                success: deleted,
                message: deleted ? 'Product deleted successfully' : 'Failed to delete product'
            };
        } catch (error) {
            return { success: false, message: 'Error deleting product' };
        }
    }

    // View operations for both stores
    async getLocalProducts(): Promise<any[]> {
        try {
            const db = await getLocalDB();
            const products = await db.products.find().exec();
            return products.map(p => p.toJSON());
        } catch (error) {
            console.error('Error fetching local products:', error);
            return [];
        }
    }

    async getRemoteProducts(): Promise<any[]> {
        try {
            const db = await getRemoteDB();
            const products = await db.products.find().exec();
            return products.map(p => p.toJSON());
        } catch (error) {
            console.error('Error fetching remote products:', error);
            return [];
        }
    }

    async getAllProducts(): Promise<{
        local: any[];
        remote: any[];
        combined: any[];
    }> {
        const [localProducts, remoteProducts] = await Promise.all([
            this.getLocalProducts(),
            this.getRemoteProducts()
        ]);

        const combined = [...localProducts, ...remoteProducts];

        return {
            local: localProducts,
            remote: remoteProducts,
            combined
        };
    }

    // Stock transfer operations
    async transferStock(
        productId: string,
        fromStore: StoreId,
        toStore: StoreId,
        quantity: number
    ): Promise<{ success: boolean; message: string }> {
        if (quantity <= 0) {
            return { success: false, message: 'Transfer quantity must be positive' };
        }

        if (fromStore === toStore) {
            return { success: false, message: 'Cannot transfer to the same store' };
        }

        try {
            const success = await this.productRepository.transferStock(productId, fromStore, toStore, quantity);
            if (success) {
                console.log(`Stock transferred: ${quantity} units from ${fromStore} to ${toStore} for product ${productId}`);
            }
            return {
                success,
                message: success ? 'Stock transferred successfully' : 'Insufficient stock or product not found'
            };
        } catch (error) {
            console.error('Error transferring stock:', error);
            return { success: false, message: 'Error transferring stock' };
        }
    }

    // Search operations
    async searchLocalProducts(query: string, category?: string): Promise<any[]> {
        try {
            const db = await getLocalDB();
            let products = await db.products.find().exec();

            if (category) {
                products = products.filter(p => p.get('category') === category);
            }

            if (query) {
                products = products.filter(product =>
                    product.get('name').en.toLowerCase().includes(query.toLowerCase()) ||
                    product.get('name').si.toLowerCase().includes(query.toLowerCase()) ||
                    (product.get('barcode') && product.get('barcode').toLowerCase().includes(query.toLowerCase()))
                );
            }

            return products.map(p => p.toJSON());
        } catch (error) {
            console.error('Error searching local products:', error);
            return [];
        }
    }

    async searchRemoteProducts(query: string, category?: string): Promise<any[]> {
        try {
            const db = await getRemoteDB();
            let products = await db.products.find().exec();

            if (category) {
                products = products.filter(p => p.get('category') === category);
            }

            if (query) {
                products = products.filter(product =>
                    product.get('name').en.toLowerCase().includes(query.toLowerCase()) ||
                    product.get('name').si.toLowerCase().includes(query.toLowerCase()) ||
                    (product.get('barcode') && product.get('barcode').toLowerCase().includes(query.toLowerCase()))
                );
            }

            return products.map(p => p.toJSON());
        } catch (error) {
            console.error('Error searching remote products:', error);
            return [];
        }
    }

    async searchAllProducts(query: string, category?: string): Promise<{
        local: any[];
        remote: any[];
        combined: any[];
    }> {
        const [localProducts, remoteProducts] = await Promise.all([
            this.searchLocalProducts(query, category),
            this.searchRemoteProducts(query, category)
        ]);

        const combined = [...localProducts, ...remoteProducts];

        return {
            local: localProducts,
            remote: remoteProducts,
            combined
        };
    }

    // Legacy search method for backward compatibility
    async searchProducts(query: string, category?: string): Promise<any[]> {
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

    // Low stock alerts
    async getLowStockAlerts(threshold: number = 5): Promise<{
        local: any[];
        remote: any[];
        combined: any[];
    }> {
        const [localProducts, remoteProducts] = await Promise.all([
            this.getLocalProducts(),
            this.getRemoteProducts()
        ]);

        const checkLowStock = (products: any[]) => {
            return products.filter(product => {
                const currentStoreStock = product.stock[this.currentStoreId] || 0;
                const minStock = product.minStock || threshold;
                return currentStoreStock <= minStock;
            });
        };

        const localLowStock = checkLowStock(localProducts);
        const remoteLowStock = checkLowStock(remoteProducts);

        return {
            local: localLowStock,
            remote: remoteLowStock,
            combined: [...localLowStock, ...remoteLowStock]
        };
    }

    // Product by ID operations
    async getLocalProductById(id: string): Promise<any | null> {
        try {
            const db = await getLocalDB();
            const product = await db.products.findOne(id).exec();
            return product ? product.toJSON() : null;
        } catch (error) {
            console.error('Error fetching local product by ID:', error);
            return null;
        }
    }

    async getRemoteProductById(id: string): Promise<any | null> {
        try {
            const db = await getRemoteDB();
            const product = await db.products.findOne(id).exec();
            return product ? product.toJSON() : null;
        } catch (error) {
            console.error('Error fetching remote product by ID:', error);
            return null;
        }
    }

    async getProductById(id: string): Promise<{
        local: any | null;
        remote: any | null;
        found: 'local' | 'remote' | 'both' | 'none';
    }> {
        const [localProduct, remoteProduct] = await Promise.all([
            this.getLocalProductById(id),
            this.getRemoteProductById(id)
        ]);

        let found: 'local' | 'remote' | 'both' | 'none' = 'none';
        if (localProduct && remoteProduct) found = 'both';
        else if (localProduct) found = 'local';
        else if (remoteProduct) found = 'remote';

        return {
            local: localProduct,
            remote: remoteProduct,
            found
        };
    }

    // WebRTC connection management
    async getConnectionStatus(): Promise<{
        isConnected: boolean;
        localStore: StoreId;
        remoteStore: StoreId;
    }> {
        const webRTCManager = getWebRTCManager();
        return {
            isConnected: webRTCManager?.getConnectionStatus() || false,
            localStore: getCurrentStoreId(),
            remoteStore: getOtherStoreId()
        };
    }

    async reconnectWebRTC(): Promise<{ success: boolean; message: string }> {
        try {
            const webRTCManager = getWebRTCManager();
            if (!webRTCManager) {
                return { success: false, message: 'WebRTC manager not initialized' };
            }

            await webRTCManager.reconnect();
            return { success: true, message: 'WebRTC reconnection initiated' };
        } catch (error) {
            console.error('Error reconnecting WebRTC:', error);
            return { success: false, message: 'Failed to reconnect WebRTC' };
        }
    }

    // Store information
    getCurrentStoreInfo(): {
        currentStore: StoreId;
        otherStore: StoreId;
        canEdit: boolean;
    } {
        return {
            currentStore: this.currentStoreId,
            otherStore: getOtherStoreId(),
            canEdit: true // Local store is always editable
        };
    }

    getRemoteStoreInfo(): {
        currentStore: StoreId;
        otherStore: StoreId;
        canEdit: boolean;
    } {
        return {
            currentStore: getOtherStoreId(),
            otherStore: this.currentStoreId,
            canEdit: false // Remote store is read-only
        };
    }

    // Sync status
    async getSyncStatus(): Promise<{
        local: any;
        remote: any;
    }> {
        // This would need to be implemented based on your sync manager
        // For now, returning basic status
        return {
            local: {
                active: true,
                store: this.currentStoreId,
                readOnly: false
            },
            remote: {
                active: true,
                store: getOtherStoreId(),
                readOnly: true
            }
        };
    }
}