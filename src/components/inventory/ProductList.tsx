import React from 'react';
import type {RxDocument} from 'rxdb';
import type {ProductDocType} from '../../db/schemas/product';

interface ProductListProps {
    products: RxDocument<ProductDocType>[];
    loading: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => Promise<{ success: boolean; message: string }>;
}

export const ProductList: React.FC<ProductListProps> = ({
                                                            products,
                                                            loading,
                                                            onEdit,
                                                            onDelete
                                                        }) => {
    const handleDelete = async (id: string, productName: string) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
            const result = await onDelete(id);
            if (result.success) {
                alert('Product deleted successfully');
            } else {
                alert(`Failed to delete: ${result.message}`);
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading products...</div>;
    }

    if (products.length === 0) {
        return <div className="no-products">No products found</div>;
    }

    return (
        <div className="product-list">
            <div className="product-grid">
                {products.map((product) => {
                    const data = product.toJSON();
                    return (
                        <div key={data.id} className="product-card">
                            <div className="product-header">
                                <h3>{data.name.en}</h3>
                                <p className="product-name-si">{data.name.si}</p>
                            </div>

                            <div className="product-details">
                                <p><strong>Price:</strong> Rs. {data.price.toFixed(2)}</p>
                                <p><strong>Category:</strong> {data.category || 'N/A'}</p>
                                <p><strong>Barcode:</strong> {data.barcode || 'N/A'}</p>
                            </div>

                            <div className="stock-info">
                                <h4>Stock Levels:</h4>
                                <div className="stock-row">
                                    <span>Store 1: {data.stock.store1}</span>
                                    <span>Store 2: {data.stock.store2}</span>
                                </div>
                                <div className="total-stock">
                                    Total: {data.stock.store1 + data.stock.store2}
                                </div>
                            </div>

                            {(data.stock.store1 <= (data.minStock || 5) ||
                                data.stock.store2 <= (data.minStock || 5)) && (
                                <div className="low-stock-warning">
                                    ⚠️ Low Stock Alert
                                </div>
                            )}

                            <div className="product-actions">
                                <button
                                    onClick={() => onEdit(data.id)}
                                    className="btn-edit"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(data.id, data.name.en)}
                                    className="btn-delete"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};