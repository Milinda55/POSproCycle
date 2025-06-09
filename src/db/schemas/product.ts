import type {RxJsonSchema, RxDocument, RxCollection} from 'rxdb';

export interface ProductDocType {
    id: string;
    name: {
        en: string;
        si: string;
    };
    description: {
        en: string;
        si: string;
    };
    category: string;
    barcode: string;
    price: number;
    cost: number;
    stock: {
        store1: number;
        store2: number;
    };
    minStock: number;
    supplier: string;
    createdAt: string;
    updatedAt: string;
}

export const productSchema: RxJsonSchema<ProductDocType> = {
    title: 'product schema',
    version: 0,
    description: 'Product inventory schema',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        name: {
            type: 'object',
            properties: {
                en: { type: 'string' },
                si: { type: 'string' }
            },
            required: ['en', 'si']
        },
        description: {
            type: 'object',
            properties: {
                en: { type: 'string' },
                si: { type: 'string' }
            },
            required: ['en', 'si']
        },
        category: {
            type: 'string'
        },
        barcode: {
            type: 'string',
            maxLength: 100
        },
        price: {
            type: 'number',
            minimum: 0
        },
        cost: {
            type: 'number',
            minimum: 0
        },
        stock: {
            type: 'object',
            properties: {
                store1: { type: 'number', minimum: 0 },
                store2: { type: 'number', minimum: 0 }
            },
            required: ['store1', 'store2']
        },
        minStock: {
            type: 'number',
            minimum: 0
        },
        supplier: {
            type: 'string'
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'name', 'barcode', 'price', 'cost', 'stock', 'minStock', 'createdAt', 'updatedAt'],
    indexes: ['barcode', 'category', 'createdAt']
};

export type ProductDocument = RxDocument<ProductDocType>;

export type ProductCollection = RxCollection<ProductDocType>;