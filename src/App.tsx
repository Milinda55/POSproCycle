import React, { useState, useEffect } from 'react';
import { ProductSearch } from './components/inventory/SearchFilter/ProductSearch.tsx';
import { InventoryService } from './services/inventoryService.ts';
import { ProductRepository } from './db/repositories/productRepository.ts';
import { initDB} from './db/initDB.ts';
import { AddProductForm } from './components/inventory/AddProductForm';
import type {ProductDocType} from './db/schemas/product.ts';
import {EditProductForm} from "./pages/Inventory/EditProduct.tsx";

interface Product extends ProductDocType {
    _id: string;
    _rev: string;
}

interface WebRTCStatus {
    isConnected: boolean;
    peerId: string;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    connectedPeers: string[];
    lastSync: Date | null;
    error: string | null;
}

const App: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // WebRTC Status
    const [webrtcStatus, setWebrtcStatus] = useState<WebRTCStatus>({
        isConnected: false,
        peerId: '',
        connectionStatus: 'disconnected',
        connectedPeers: [],
        lastSync: null,
        error: null
    });

    // Database selection
    const [selectedDatabase, setSelectedDatabase] = useState<'store1' | 'store2'>('store1');
    const [availableDatabases] = useState<Array<{id: 'store1' | 'store2', name: string}>>([
        { id: 'store1', name: 'Store 1 Database' },
        { id: 'store2', name: 'Store 2 Database' }
    ]);

    const [inventoryService, setInventoryService] = useState<InventoryService | null>(null);

    useEffect(() => {
        const initializeDatabase = async () => {
            try {
                setLoading(true);
                const { localDb } = await initDB(selectedDatabase);
                const productRepository = new ProductRepository(() => Promise.resolve(localDb));
                setInventoryService(new InventoryService(productRepository));
            } catch (err) {
                console.error('Failed to initialize database:', err);
                setError('Failed to initialize database');
            } finally {
                setLoading(false);
            }
        };

        initializeDatabase();
    }, [selectedDatabase]);

    // Initialize WebRTC connection
    useEffect(() => {
        initializeWebRTC();
    }, [selectedDatabase]);

    const initializeWebRTC = async () => {
        try {
            setWebrtcStatus(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));

            // Meka poddak balala hadahan

            // Initialize WebRTC sync here
            // This would call your WebRTC service
            // const webrtcService = new WebRTCService();
            // await webrtcService.initialize(selectedDatabase);

            // Mock WebRTC initialization for now
            setTimeout(() => {
                setWebrtcStatus(prev => ({
                    ...prev,
                    connectionStatus: 'connected',
                    isConnected: true,
                    peerId: `peer-${selectedDatabase}-${Date.now().toString().slice(-6)}`,
                    connectedPeers: ['peer-example-123'],
                    lastSync: new Date()
                }));
            }, 2000);

        } catch (err: any) {
            setWebrtcStatus(prev => ({
                ...prev,
                connectionStatus: 'error',
                error: err.message
            }));
        }
    };

    const handleDatabaseSwitch = (dbId: 'store1' | 'store2') => {
        setSelectedDatabase(dbId);
        setProducts([]); // Clear products when switching
        loadAllProducts(); // Reload products for new database
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
    };

    const handleUpdateProduct = async (updatedProduct: ProductDocType) => {
        if (!editingProduct) return { success: false, errors: ['No product selected'] };

        try {
            const result = await inventoryService?.updateProduct(
                editingProduct.id,
                updatedProduct
            );

            if (result.success) {
                await loadAllProducts();
                setEditingProduct(null);
                // Trigger sync after update
                await triggerSync();
            }

            return result;
        } catch (err: any) {
            return { success: false, errors: [err.message] };
        }
    };

    const triggerSync = async () => {
        try {
            setWebrtcStatus(prev => ({ ...prev, lastSync: new Date() }));
            // Call your WebRTC sync method here
            // await webrtcService.sync();
        } catch (err: any) {
            setWebrtcStatus(prev => ({ ...prev, error: err.message }));
        }
    };

    const renderWebRTCStatus = () => (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: webrtcStatus.connectionStatus === 'connected' ? '#e8f5e8' : '#f8f8f8'
        }}>
            <h3>WebRTC Connection Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                    <strong>Status:</strong>
                    <span style={{
                        color: webrtcStatus.connectionStatus === 'connected' ? 'green' :
                            webrtcStatus.connectionStatus === 'error' ? 'red' : 'orange',
                        marginLeft: '0.5rem'
                    }}>
                        {webrtcStatus.connectionStatus.toUpperCase()}
                    </span>
                </div>
                <div><strong>Peer ID:</strong> {webrtcStatus.peerId || 'Not assigned'}</div>
                <div><strong>Connected Peers:</strong> {webrtcStatus.connectedPeers.length}</div>
                <div><strong>Last Sync:</strong> {webrtcStatus.lastSync ? webrtcStatus.lastSync.toLocaleTimeString() : 'Never'}</div>
            </div>

            {webrtcStatus.error && (
                <div style={{ color: 'red', marginTop: '0.5rem' }}>
                    <strong>Error:</strong> {webrtcStatus.error}
                </div>
            )}

            <div style={{ marginTop: '1rem' }}>
                <button
                    onClick={initializeWebRTC}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '0.5rem'
                    }}
                >
                    Reconnect
                </button>
                <button
                    onClick={triggerSync}
                    disabled={webrtcStatus.connectionStatus !== 'connected'}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: webrtcStatus.connectionStatus === 'connected' ? '#4CAF50' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: webrtcStatus.connectionStatus === 'connected' ? 'pointer' : 'not-allowed'
                    }}
                >
                    Manual Sync
                </button>
            </div>
        </div>
    );

    const renderDatabaseSelector = () => (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
        }}>
            <h3>Database Selection</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span><strong>Active Database:</strong></span>
                {availableDatabases.map(db => (
                    <button
                        key={db.id}
                        onClick={() => handleDatabaseSwitch(db.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: selectedDatabase === db.id ? '#4CAF50' : '#f1f1f1',
                            color: selectedDatabase === db.id ? 'white' : 'black',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {db.name}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Current: {availableDatabases.find(db => db.id === selectedDatabase)?.name}
            </div>
        </div>
    );

    const renderProductCard = (product: Product) => (
        <div
            key={product._id}
            className="product-card"
            style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '1rem',
                margin: '1rem',
                minWidth: '250px',
                position: 'relative'
            }}
        >
            <h3>{product.name.en}</h3>
            <p><strong>Barcode:</strong> {product.barcode}</p>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Price:</strong> Rs.{product.price}</p>
            <p><strong>Quantity:</strong> {product.quantity}</p>
            <p><strong>Stock:</strong> Store1: {product.stock.store1}, Store2: {product.stock.store2}</p>

            {/* Show database indicator */}
            <div style={{
                position: 'absolute',
                top: '0.5rem',
                left: '0.5rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: selectedDatabase === 'store1' ? '#4CAF50' : '#FF9800',
                color: 'white',
                fontSize: '0.8rem',
                borderRadius: '4px'
            }}>
                {selectedDatabase.toUpperCase()}
            </div>

            <button
                onClick={() => handleEdit(product)}
                style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Edit
            </button>
        </div>
    );

    useEffect(() => {
        loadAllProducts();
    }, [selectedDatabase]);

    const loadAllProducts = async () => {
        if (!inventoryService) return;

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
            // Trigger sync after adding
            await triggerSync();
            return result;
        } catch (err: any) {
            return { success: false, errors: [err.message] };
        }
    };

    return (
        <div className="app" style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
            {/* Overlay for when edit form is open */}
            {editingProduct && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 999
                }} />
            )}

            <h1>Product Inventory - WebRTC Sync Test</h1>

            {/* Database Selection */}
            {renderDatabaseSelector()}

            {/* WebRTC Status */}
            {renderWebRTCStatus()}

            <ProductSearch onSearch={handleSearch} />

            <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: showForm ? '#f44336' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {showForm ? 'Cancel Add Product' : 'Add New Product'}
                </button>

                <button
                    onClick={loadAllProducts}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Refresh Products
                </button>
            </div>

            {showForm && (
                <AddProductForm
                    onSubmit={handleAddProduct}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {error && (
                <div style={{
                    color: 'white',
                    backgroundColor: '#f44336',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    margin: '1rem 0'
                }}>
                    {error}
                </div>
            )}

            {loading && (
                <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    borderRadius: '4px',
                    margin: '1rem 0'
                }}>
                    Loading...
                </div>
            )}

            <div className="products-list" style={{ marginTop: '2rem' }}>
                <h2>Products ({products.length}) - {availableDatabases.find(db => db.id === selectedDatabase)?.name}</h2>

                {products.length === 0 && !loading ? (
                    <p style={{ fontStyle: 'italic', color: '#666' }}>
                        No products found in {availableDatabases.find(db => db.id === selectedDatabase)?.name}.
                        Add a product to get started.
                    </p>
                ) : (
                    <div className="products-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1rem'
                    }}>
                        {products.map(renderProductCard)}
                    </div>
                )}
            </div>

            {editingProduct && (
                <EditProductForm
                    product={editingProduct}
                    onSubmit={handleUpdateProduct}
                    onCancel={() => setEditingProduct(null)}
                />
            )}
        </div>
    );
};

export default App;