import React, { useState, useEffect } from 'react';
import { ProductSearch } from './components/inventory/SearchFilter/ProductSearch.tsx';
import { InventoryService } from './services/inventoryService.ts';
import { ProductRepository } from './db/repositories/productRepository.ts';
import { getRxDB } from './db/initDB.ts';
import { AddProductForm } from './components/inventory/AddProductForm';
import type {ProductDocType} from './db/schemas/product.ts';

interface Product extends ProductDocType {
    _id: string;
    _rev: string;
}

const App: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [inventoryService] = useState(() => {
        const productRepository = new ProductRepository(getRxDB);
        return new InventoryService(productRepository);
    });

    useEffect(() => {
        loadAllProducts();
    }, []);

    const loadAllProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const allDocs = await inventoryService.searchProducts('');
            const result = allDocs.map((doc: any) => ({
                ...doc.toJSON(),
                _id: doc.primary,
                _rev: doc._rev
            }));

            setProducts(result);
        } catch (err) {
            console.error('Failed to load products:', err);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string, category?: string) => {
        try {
            setLoading(true);
            setError(null);

            const searchDocs = await inventoryService.searchProducts(query, category);
            const results = searchDocs.map((doc: any) => ({
                ...doc.toJSON(),
                _id: doc.primary,
                _rev: doc._rev
            }));

            setProducts(results);
        } catch (err) {
            console.error('Search failed:', err);
            setError('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (product: Omit<ProductDocType, 'id'>) => {
        try {
            const result = await inventoryService.addProduct(product);
            await loadAllProducts();
            setShowForm(false);
            return result;
        } catch (err: any) {
            return { success: false, errors: [err.message] };
        }
    };

    return (
        <div className="app" style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
            <h1>Product Inventory</h1>

            <ProductSearch onSearch={handleSearch} />

            <button onClick={() => setShowForm(!showForm)} style={{ margin: '1rem 0' }}>
                {showForm ? 'Hide Form' : 'Add New Product'}
            </button>

            {showForm && (
                <AddProductForm onSubmit={handleAddProduct} onCancel={() => setShowForm(false)} />
            )}

            {error && <div style={{ color: 'red', margin: '1rem 0' }}>{error}</div>}

            {loading && <div style={{ margin: '1rem 0' }}>Loading...</div>}

            <div className="products-list" style={{ marginTop: '2rem' }}>
                <h2>Products ({products.length})</h2>
                {products.length === 0 && !loading ? (
                    <p>No products found.</p>
                ) : (
                    <div className="products-grid" style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {products.map(product => (
                            <div
                                key={product._id}
                                className="product-card"
                                style={{
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    margin: '1rem',
                                    minWidth: '250px'
                                }}
                            >
                                <h3>{product.name.en}</h3>
                                <p><strong>Barcode:</strong> {product.barcode}</p>
                                <p><strong>Category:</strong> {product.category}</p>
                                <p><strong>Price:</strong> Rs.{product.price}</p>
                                <p><strong>Quantity:</strong> {product.quantity}</p>
                                <p><strong>Stock:</strong> Store1: {product.stock.store1}, Store2: {product.stock.store2}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
