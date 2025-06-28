import React, { useState } from 'react';
import type {ProductDocType} from '../../db/schemas/product';
import { CATEGORIES } from '../../utils/constants';
import '../../styles/components/inventory/inventory.scss'

interface AddProductFormProps {
    onSubmit: (product: Omit<ProductDocType, 'id'>) => Promise<{ success: boolean; errors?: any[] }>;
    onCancel: () => void;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Omit<ProductDocType, 'id'>>({
        name: { en: 'My Product Test', si: 'මගේ නිෂ්පාදන පරීක්ෂණය' },
        price: 50,
        quantity: 5,
        stock: { store1: 2, store2: 0 },
        minStock: 5,
        category: '',
        barcode: 'testcode123'
    });
    const [errors, setErrors] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        console.log("Clicked")

        const submissionData = {
            ...formData,
            price: Number(formData.price),
            quantity: Number(formData.quantity),
            stock: {
                store1: Number(formData.stock.store1),
                store2: Number(formData.stock.store2)
            },
            minStock: Number(formData.minStock)
        };

        const result = await onSubmit(submissionData);

        if (result.success) {
            // Reset form
            setFormData({
                name: { en: '', si: '' },
                price: 0,
                quantity: 0,
                stock: { store1: 0, store2: 0 },
                minStock: 5,
                category: '',
                barcode: ''
            });
            setErrors([]);
        } else {
            setErrors(result.errors || []);
        }

        setSubmitting(false);
    };


    return (
        <form onSubmit={handleSubmit} className="add-product-form">
            <h2>Add New Product</h2>

            <div className="form-group">
                <label>Product Name (English)*</label>
                <input
                    type="text"
                    value={formData.name.en}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        name: { ...prev.name, en: e.target.value }
                    }))}
                />
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
                />
            </div>

            <div className="form-group">
                <label>Price*</label>
                <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
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
                    {submitting ? 'Adding...' : 'Add Product'}
                </button>
            </div>
        </form>
    );
};