import { InventoryService } from '../services/inventoryService';
import { ProductRepository } from '../db/repositories/productRepository';
import { initDB } from '../db/initDB';

// Global testing interface
declare global {
    interface Window {
        testInventory: {
            service: InventoryService;
            repository: ProductRepository;
            addSampleProducts: () => Promise<void>;
            testCRUD: () => Promise<void>;
            testSearch: () => Promise<void>;
            testStockTransfer: () => Promise<void>;
            clearAllProducts: () => Promise<void>;
        };
    }
}

export const initTestingHelpers = () => {
    const repository = new ProductRepository(initDB);
    const service = new InventoryService(repository);

    const sampleProducts = [
        {
            name: { en: "Mountain Bike", si: "කඳු බයිසිකලය" },
            price: 25000,
            quantity: 10,
            stock: { store1: 5, store2: 5 },
            category: "Bikes",
            barcode: "MB001",
            minStock: 3
        },
        {
            name: { en: "Bike Chain", si: "බයිසිකල් දම්වැල" },
            price: 1500,
            quantity: 20,
            stock: { store1: 12, store2: 8 },
            category: "Parts",
            barcode: "BC001",
            minStock: 5
        },
        {
            name: { en: "Helmet", si: "හිස් ආරක්ෂකය" },
            price: 3500,
            quantity: 15,
            stock: { store1: 2, store2: 13 }, // Low stock in store1
            category: "Accessories",
            barcode: "HM001",
            minStock: 5
        }
    ];

    window.testInventory = {
        service,
        repository,

        async addSampleProducts() {
            console.log('🔄 Adding sample products...');
            for (const product of sampleProducts) {
                const result = await service.addProduct(product);
                if (result.success) {
                    console.log(`✅ Added: ${product.name.en}`);
                } else {
                    console.error(`❌ Failed to add ${product.name.en}:`, result.errors);
                }
            }
            console.log('✨ Sample products added!');
        },

        async testCRUD() {
            console.log('🧪 Testing CRUD operations...');

            // CREATE
            const createResult = await service.addProduct({
                name: { en: "Test Product", si: "පරීක්ෂණ නිෂ්පාදනය" },
                price: 1000,
                quantity: 5,
                stock: { store1: 3, store2: 2 },
                category: "Tools",
                barcode: "TEST001"
            });

            if (createResult.success) {
                console.log('✅ CREATE: Product created successfully');
                const productId = createResult.product.get('id');

                // READ
                const product = await repository.getProductById(productId);
                if (product) {
                    console.log('✅ READ: Product found:', product.get('name').en);

                    // UPDATE
                    const updateResult = await service.updateProduct(productId, {
                        price: 1200,
                        stock: { store1: 5, store2: 3 }
                    });

                    if (updateResult.success) {
                        console.log('✅ UPDATE: Product updated successfully');

                        // DELETE
                        const deleteResult = await service.deleteProduct(productId);
                        if (deleteResult.success) {
                            console.log('✅ DELETE: Product deleted successfully');
                        } else {
                            console.error('❌ DELETE failed:', deleteResult.message);
                        }
                    } else {
                        console.error('❌ UPDATE failed:', updateResult.errors);
                    }
                } else {
                    console.error('❌ READ: Product not found');
                }
            } else {
                console.error('❌ CREATE failed:', createResult.errors);
            }
        },

        async testSearch() {
            console.log('🔍 Testing search functionality...');

            // Search by name
            const nameResults = await service.searchProducts('bike');
            console.log(`✅ Name search ('bike'): Found ${nameResults.length} products`);

            // Search by category
            const categoryResults = await service.searchProducts('', 'Bikes');
            console.log(`✅ Category search ('Bikes'): Found ${categoryResults.length} products`);

            // Search by barcode
            const barcodeResults = await service.searchProducts('MB001');
            console.log(`✅ Barcode search ('MB001'): Found ${barcodeResults.length} products`);

            // Get low stock products
            const lowStockProducts = await service.getLowStockAlerts(5);
            console.log(`⚠️ Low stock products: Found ${lowStockProducts.length} products`);
            lowStockProducts.forEach(product => {
                const data = product.toJSON();
                console.log(`  - ${data.name.en}: Store1=${data.stock.store1}, Store2=${data.stock.store2}`);
            });
        },

        async testStockTransfer() {
            console.log('📦 Testing stock transfer...');

            // Find a product with stock in store1
            const products = await repository.getAllProducts();
            const productWithStock = products.find(p => p.get('stock').store1 > 2);

            if (productWithStock) {
                const productId = productWithStock.get('id');
                const initialStock = productWithStock.get('stock');
                console.log(`Initial stock - Store1: ${initialStock.store1}, Store2: ${initialStock.store2}`);

                const transferResult = await service.transferStock(productId, 'store1', 'store2', 2);

                if (transferResult.success) {
                    console.log('✅ Stock transfer successful');

                    // Verify the transfer
                    const updatedProduct = await repository.getProductById(productId);
                    if (updatedProduct) {
                        const newStock = updatedProduct.get('stock');
                        console.log(`New stock - Store1: ${newStock.store1}, Store2: ${newStock.store2}`);
                    }
                } else {
                    console.error('❌ Stock transfer failed:', transferResult.message);
                }
            } else {
                console.log('⚠️ No products with sufficient stock found for transfer test');
            }
        },

        async clearAllProducts() {
            console.log('🧹 Clearing all products...');
            const products = await repository.getAllProducts();
            let deletedCount = 0;

            for (const product of products) {
                const result = await service.deleteProduct(product.get('id'));
                if (result.success) {
                    deletedCount++;
                }
            }

            console.log(`✅ Deleted ${deletedCount} products`);
        }
    };

    console.log('🚀 Testing helpers initialized! Use window.testInventory in console');
    console.log('Available commands:');
    console.log('  - window.testInventory.addSampleProducts()');
    console.log('  - window.testInventory.testCRUD()');
    console.log('  - window.testInventory.testSearch()');
    console.log('  - window.testInventory.testStockTransfer()');
    console.log('  - window.testInventory.clearAllProducts()');
};