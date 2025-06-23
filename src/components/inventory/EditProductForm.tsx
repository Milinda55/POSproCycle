// edit product forms

import React, { useState, useEffect } from 'react';
import type {ProductDocType} from '../../db/schemas/product';
import { CATEGORIES } from '../../utils/constants';

interface EditProductFormProps {
    productId: string;
    initialData?: ProductDocType;
    onSubmit: (updates: Partial<ProductDocType>) => Promise<{ success: boolean; errors?: any[] }>;
    onCancel: () => void;
}

export const EditProductForm: React.FC<EditProductFormProps> = ({
                                                                    initialData,
                                                                    onSubmit,
                                                                    onCancel
                                                                }) => {
    const [formData, setFormData] = useState({
        name: { en: '', si: '' },
        price: 0,
        stock: { store1: 0, store2: 0 },
        minStock: 5,
        category: '',
        barcode: ''
    });
    const [errors, setErrors] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                price: initialData.price,
                stock: initialData.stock,
                minStock: initialData.minStock || 5,
                category: initialData.category || '',
                barcode: initialData.barcode || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const result = await onSubmit(formData);

        if (result.success) {
            // Form will be closed by parent component
        } else {
            setErrors(result.errors || []);
        }

        setSubmitting(false);
    };

    const getFieldError = (fieldName: string) => {
        return errors.find(error => error.field === fieldName)?.message;
    };

    return (
        <form onSubmit={handleSubmit} className="edit-product-form">
            <h2>Edit Product</h2>

            <div className="form-group">
                <label>Product Name (English)*</label>
                <input
                    type="text"
                    value={formData.name.en}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        name: { ...prev.name, en: e.target.value }
                    }))}
                    className={getFieldError('name.en') ? 'error' : ''}
                />
                {getFieldError('name.en') && <span className="error-text">{getFieldError('name.en')}</span>}
            </div>

            <div className="form-group">
                <label>Product Name (Sinhala)*</label>
                <input
                    type="text"
                    value={formData.name.si}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        name: { ...prev.name, si: e.target.value }
                    }))}
                    className={getFieldError('name.si') ? 'error' : ''}
                />
                {getFieldError('name.si') && <span className="error-text">{getFieldError('name.si')}</span>}
            </div>

            <div className="form-group">
                <label>Price*</label>
                <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className={getFieldError('price') ? 'error' : ''}
                />
                {getFieldError('price') && <span className="error-text">{getFieldError('price')}</span>}
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Store 1 Stock</label>
                    <input
                        type="number"
                        value={formData.stock.store1}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            stock: { ...prev.stock, store1: parseInt(e.target.value) || 0 }
                        }))}
                    />
                </div>

                <div className="form-group">
                    <label>Store 2 Stock</label>
                    <input
                        type="number"
                        value={formData.stock.store2}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            stock: { ...prev.stock, store2: parseInt(e.target.value) || 0 }
                        }))}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Category</label>
                <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                    <option value="">Select Category</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Barcode</label>
                <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                />
            </div>

            <div className="form-group">
                <label>Minimum Stock Alert</label>
                <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                />
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancel} disabled={submitting}>
                    Cancel
                </button>
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Updating...' : 'Update Product'}
                </button>
            </div>
        </form>
    );
};