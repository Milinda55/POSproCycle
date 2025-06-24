export const STORES = {
    STORE1: 'store1',
    STORE2: 'store2'
} as const;

export const CATEGORIES = [
    'Bikes',
    'Parts',
    'Accessories',
    'Tools',
    'Maintenance',
    'Clothing'
];

export const LOW_STOCK_THRESHOLD = 5;

export const PRODUCT_SEARCH_FIELDS = ['name.en', 'name.si', 'barcode', 'category'];