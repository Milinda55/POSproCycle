import { ProductRepository } from '../db/repositories/productRepository';
import type {ProductDocType} from '../db/schemas/product';
import { validateProduct, type ValidationError } from '../utils/validation';

export class InventoryService {
    private productRepository: ProductRepository
    constructor(productRepository: ProductRepository) {
        this.productRepository = productRepository;
    }

    async addProduct(productData: Omit<ProductDocType, 'id'>): Promise<{ success: boolean; product?: any; errors?: ValidationError[] }> {
        const errors = validateProduct(productData);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        try {
            const product = await this.productRepository.createProduct(productData);
            return { success: true, product };
        } catch (error) {
            return { success: false, errors: [{ field: 'general', message: 'Failed to create product' }] };
        }
    }

    async updateProduct(id: string, updates: Partial<ProductDocType>): Promise<{ success: boolean; product?: any; errors?: ValidationError[] }> {
        const errors = validateProduct(updates);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        try {
            const product = await this.productRepository.updateProduct(id, updates);
            if (!product) {
                return { success: false, errors: [{ field: 'general', message: 'Product not found' }] };
            }
            return { success: true, product };
        } catch (error) {
            return { success: false, errors: [{ field: 'general', message: 'Failed to update product' }] };
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