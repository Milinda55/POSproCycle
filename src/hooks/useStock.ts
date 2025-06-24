import {useState} from 'react';
import {InventoryService} from '../services/inventoryService';

export const useStock = (inventoryService: InventoryService) => {
    const [transferring, setTransferring] = useState(false);

    const transferStock = async (
        productId: string,
        fromStore: 'store1' | 'store2',
        toStore: 'store1' | 'store2',
        quantity: number
    ) => {
        setTransferring(true);
        try {
            return await inventoryService.transferStock(productId, fromStore, toStore, quantity);
        } finally {
            setTransferring(false);
        }
    };

    const getLowStockAlerts = async (threshold?: number) => {
        return await inventoryService.getLowStockAlerts(threshold);
    };

    return {
        transferStock,
        getLowStockAlerts,
        transferring
    };
};