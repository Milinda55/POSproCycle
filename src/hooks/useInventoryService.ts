import { useMemo } from 'react';
import { InventoryService } from '../services/inventoryService';
import { ProductRepository } from '../db/repositories/productRepository';
import { initDB } from '../db/initDB';

export const useInventoryService = () => {
    return useMemo(() => {
        const productRepository = new ProductRepository(initDB);
        return new InventoryService(productRepository);
    }, []);
};