import React, { useState } from 'react';
import type {ProductDocType} from '../../db/schemas/product';
import { CATEGORIES } from '../../utils/constants';

interface EditProductFormProps {
    product: ProductDocType;
    onSubmit: (updatedProduct: ProductDocType) => Promise<{ success: boolean; errors?: string[] }>;
    onCancel: () => void;
}

export const EditProductForm: React.FC<EditProductFormProps> = ({
                                                                    product,
                                                                    onSubmit,
                                                                    onCancel
                                                                }) => {
    const [formData, setFormData] = useState<ProductDocType>({ ...product });
    const [errors, setErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const result = await onSubmit(formData);

        if (!result.success) {
            setErrors(result.errors || ['Update failed']);
        }

        setSubmitting(false);
    };

    return (
        <div className="edit-form" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            width: '80%',
            maxWidth: '500px'
        }}>
            <h2>Edit Product</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label>Name (English)</label>
                    <input
                        type="text"
                        value={formData.name.en}
                        onChange={(e) => setFormData({
                            ...formData,
                            name: { ...formData.name, en: e.target.value }
                        })}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Name (Sinhala)</label>
                    <input
                        type="text"
                        value={formData.name.si}
                        onChange={(e) => setFormData({
                            ...formData,
                            name: { ...formData.name, si: e.target.value }
                        })}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Price</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0
                        })}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Quantity</label>
                    <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({
                            ...formData,
                            quantity: parseInt(e.target.value) || 0
                        })}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label>Store 1 Stock</label>
                        <input
                            type="number"
                            value={formData.stock.store1}
                            onChange={(e) => setFormData({
                                ...formData,
                                stock: {
                                    ...formData.stock,
                                    store1: parseInt(e.target.value) || 0
                                }
                            })}
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Store 2 Stock</label>
                        <input
                            type="number"
                            value={formData.stock.store2}
                            onChange={(e) => setFormData({
                                ...formData,
                                stock: {
                                    ...formData.stock,
                                    store2: parseInt(e.target.value) || 0
                                }
                            })}
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Category</label>
                    <select
                        value={formData.category || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            category: e.target.value || undefined
                        })}
                        style={{ width: '100%', padding: '0.5rem' }}
                    >
                        <option value="">Select Category</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Barcode</label>
                    <input
                        type="text"
                        value={formData.barcode || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            barcode: e.target.value || undefined
                        })}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Minimum Stock</label>
                    <input
                        type="number"
                        value={formData.minStock || 0}
                        onChange={(e) => setFormData({
                            ...formData,
                            minStock: parseInt(e.target.value) || undefined
                        })}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                {errors.length > 0 && (
                    <div style={{ color: 'red', margin: '1rem 0' }}>
                        {errors.map((error, i) => (
                            <div key={i}>{error}</div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none'
                        }}
                    >
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};