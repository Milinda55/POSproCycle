import type {RxJsonSchema, RxDocument, RxCollection} from 'rxdb';

export interface SaleDocType {
    id: string;
    storeId: string;
    items: Array<{
        productId: string;
        quantity: number;
        price: number;
        discount: number;
    }>;
    total: number;
    discount: number;
    finalAmount: number;
    paymentMethod: string;
    timestamp: string;
}

export const saleSchema: RxJsonSchema<SaleDocType> = {
    title: 'sale schema',
    version: 0,
    description: 'Sales transaction schema',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        storeId: {
            type: 'string'
        },
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    productId: { type: 'string' },
                    quantity: { type: 'number', minimum: 1 },
                    price: { type: 'number', minimum: 0 },
                    discount: { type: 'number', minimum: 0 }
                },
                required: ['productId', 'quantity', 'price', 'discount']
            }
        },
        total: {
            type: 'number',
            minimum: 0
        },
        discount: {
            type: 'number',
            minimum: 0
        },
        finalAmount: {
            type: 'number',
            minimum: 0
        },
        paymentMethod: {
            type: 'string'
        },
        timestamp: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'storeId', 'items', 'total', 'finalAmount', 'paymentMethod', 'timestamp'],
    indexes: ['storeId', 'timestamp']
};

export type SaleDocument = RxDocument<SaleDocType>;
export type SaleCollection = RxCollection<SaleDocType>;