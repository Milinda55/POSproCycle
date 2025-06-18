import type { RxJsonSchema, RxDocument, RxCollection } from 'rxdb';

export interface ProductDocType {
    id: string;
    name: {
        en: string;
        si: string;
    };
    price: number;
    quantity: number;
    stock: {
        store1: number;
        store2: number;
    };
    minStock?: number;
    category?: string;
    barcode?: string;
}

export const productSchema: RxJsonSchema<ProductDocType> = {
    version: 1,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100,
            pattern: '^[a-zA-Z0-9][a-zA-Z0-9-_:.]*$'
        },
        name: {
            type: 'object',
            properties: {
                en: {
                    type: 'string',
                    maxLength: 200
                },
                si: {
                    type: 'string',
                    maxLength: 200
                }
            },
            required: ['en', 'si']
        },
        price: {
            type: 'number',
            minimum: 0,
            maximum: 999999.99,
            multipleOf: 0.01
        },
        quantity: {
            type: 'number',
            minimum: 0,
            maximum: 999999,
            multipleOf: 1
        },
        stock: {
            type: 'object',
            properties: {
                store1: {
                    type: 'number',
                    minimum: 0,
                    maximum: 999999,
                    multipleOf: 1
                },
                store2: {
                    type: 'number',
                    minimum: 0,
                    maximum: 999999,
                    multipleOf: 1
                }
            },
            required: ['store1', 'store2']
        },
        minStock: {
            type: 'number',
            default: 5,
            minimum: 0,
            maximum: 999999,
            multipleOf: 1
        },
        category: {
            type: 'string',
            maxLength: 100
        },
        barcode: {
            type: 'string',
            maxLength: 100
        }
    },

    required: ['id', 'name', 'price', 'quantity', 'stock'],
    indexes: [
        ['name.en'], ['price']
    ],
    additionalProperties: false
};

export type ProductDocument = RxDocument<ProductDocType>;
export type ProductCollection = RxCollection<ProductDocType>;