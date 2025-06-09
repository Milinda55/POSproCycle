import type {RxJsonSchema, RxDocument, RxCollection} from 'rxdb';

export interface SettingsDocType {
    id: string;
    storeId: string;
    storeName: string;
    language: 'en' | 'si';
    currency: string;
    taxRate: number;
    lowStockThreshold: number;
    syncEnabled: boolean;
    lastSyncTime: string;
}

export const settingsSchema: RxJsonSchema<SettingsDocType> = {
    title: 'settings schema',
    version: 0,
    description: 'App settings schema',
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
        storeName: {
            type: 'string'
        },
        language: {
            type: 'string',
            enum: ['en', 'si']
        },
        currency: {
            type: 'string'
        },
        taxRate: {
            type: 'number',
            minimum: 0
        },
        lowStockThreshold: {
            type: 'number',
            minimum: 0
        },
        syncEnabled: {
            type: 'boolean'
        },
        lastSyncTime: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'storeId', 'storeName', 'language', 'currency', 'taxRate', 'lowStockThreshold', 'syncEnabled']
};

export type SettingsDocument = RxDocument<SettingsDocType>;
export type SettingsCollection = RxCollection<SettingsDocType>;