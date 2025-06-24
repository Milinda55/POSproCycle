import { useState, useEffect } from 'react';
import type {RxDocument} from 'rxdb';
import type {ProductDocType} from '../db/schemas/product';
import {useInventoryService} from "./useInventoryService.ts";

export const useProducts = (inventoryService: ReturnType<typeof useInventoryService>) => {
    const [products, setProducts] = useState<RxDocument<ProductDocType>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const allProducts = await inventoryService.searchProducts('');
            setProducts(allProducts);
            setError(null);window.testInventory.clearAllProducts()
        } catch (err) {
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const addProduct = async (productData: Omit<ProductDocType, 'id'>) => {
        const result = await inventoryService.addProduct(productData);
        if (result.success) {
            await loadProducts(); // Refresh the list
        }
        return result;
    };

    const updateProduct = async (id: string, updates: Partial<ProductDocType>) => {
        const result = await inventoryService.updateProduct(id, updates);
        if (result.success) {
            await loadProducts(); // Refresh the list
        }
        return result;
    };

    const deleteProduct = async (id: string) => {
        const result = await inventoryService.deleteProduct(id);
        if (result.success) {
            await loadProducts(); // Refresh the list
        }
        return result;
    };

    const searchProducts = async (query: string, category?: string) => {
        setLoading(true);
        try {
            const results = await inventoryService.searchProducts(query, category);
            setProducts(results);
        } catch (err) {
            setError('Search failed');
        } finally {
            setLoading(false);
        }
    };

    return {
        products,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        searchProducts,
        refreshProducts: loadProducts
    };
};