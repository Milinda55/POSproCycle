import type {ProductDocType} from "../db/schemas/product.ts";

export interface ValidationError {
    field: string;
    message: string;
}

export const validateProduct = (product: Partial<ProductDocType>): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!product.name?.en?.trim()) {
        errors.push({ field: 'name.en', message: 'English name is required' });
    }

    if (!product.name?.si?.trim()) {
        errors.push({ field: 'name.si', message: 'Sinhala name is required' });
    }

    if (!product.price || product.price <= 0) {
        errors.push({ field: 'price', message: 'Price must be greater than 0' });
    }

    if (product.quantity !== undefined && product.quantity < 0) {
        errors.push({ field: 'quantity', message: 'Quantity cannot be negative' });
    }

    if (product.stock?.store1 !== undefined && product.stock.store1 < 0) {
        errors.push({ field: 'stock.store1', message: 'Store 1 stock cannot be negative' });
    }

    if (product.stock?.store2 !== undefined && product.stock.store2 < 0) {
        errors.push({ field: 'stock.store2', message: 'Store 2 stock cannot be negative' });
    }

    return errors;
};