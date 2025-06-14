export interface ProductDocType {
    id: string
    name: {
        en: string
        si: string
    }
    description: {
        en: string
        si: string
    }
    category: string
    barcode: string
    price: number
    cost: number
    stock: {
        store1: number
        store2: number
    }
    minStock: number
    supplier: string
    createdAt: string
    updatedAt: string
}

export const products: ProductDocType[] = [
    {
        id: "P003",
        name: { en: "Bill", si: "සිංහල_Bill" },
        description: { en: "High quality bill", si: "ඉතා උසස් සිංහල_Bill" },
        category: "Electronics",
        barcode: "4981833454",
        price: 32.24,
        cost: 20.77,
        stock: { store1: 67, store2: 33 },
        minStock: 6,
        supplier: "Howard-Pena",
        createdAt: "2025-04-14",
        updatedAt: "2025-06-13",
    },
    {
        id: "P004",
        name: { en: "Animal", si: "සිංහල_Animal" },
        description: { en: "High quality animal", si: "ඉතා උසස් සිංහල_Animal" },
        category: "Fruits",
        barcode: "3322980935",
        price: 30.05,
        cost: 19.74,
        stock: { store1: 5, store2: 43 },
        minStock: 10,
        supplier: "Robinson-Hopkins",
        createdAt: "2024-06-21",
        updatedAt: "2025-06-13",
    },
    {
        id: "P005",
        name: { en: "Card", si: "සිංහල_Card" },
        description: { en: "High quality card", si: "ඉතා උසස් සිංහල_Card" },
        category: "Stationery",
        barcode: "5351375952",
        price: 15.77,
        cost: 11.83,
        stock: { store1: 49, store2: 44 },
        minStock: 18,
        supplier: "Carr-Cox",
        createdAt: "2024-07-04",
        updatedAt: "2025-02-10",
    },
    {
        id: "P006",
        name: { en: "Chocolate", si: "සිංහල_Chocolate" },
        description: { en: "High quality chocolate", si: "ඉතා උසස් සිංහල_Chocolate" },
        category: "Snacks",
        barcode: "5291979936",
        price: 10,
        cost: 6.97,
        stock: { store1: 64, store2: 65 },
        minStock: 17,
        supplier: "Brown Group",
        createdAt: "2024-10-04",
        updatedAt: "2025-03-23",
    },
    {
        id: "P007",
        name: { en: "Chair", si: "සිංහල_Chair" },
        description: { en: "High quality chair", si: "ඉතා උසස් සිංහල_Chair" },
        category: "Electronics",
        barcode: "7354513813",
        price: 38.71,
        cost: 26.58,
        stock: { store1: 78, store2: 40 },
        minStock: 6,
        supplier: "Waters PLC",
        createdAt: "2024-12-21",
        updatedAt: "2025-06-10",
    },
    {
        id: "P008",
        name: { en: "Table", si: "සිංහල_Table" },
        description: { en: "High quality table", si: "ඉතා උසස් සිංහල_Table" },
        category: "Electronics",
        barcode: "6228815173",
        price: 47.46,
        cost: 37.96,
        stock: { store1: 35, store2: 76 },
        minStock: 11,
        supplier: "Curtis-Barnes",
        createdAt: "2024-09-22",
        updatedAt: "2025-04-28",
    },
    {
        id: "P009",
        name: { en: "Book", si: "සිංහල_Book" },
        description: { en: "High quality book", si: "ඉතා උසස් සිංහල_Book" },
        category: "Stationery",
        barcode: "7913503174",
        price: 12.8,
        cost: 10.12,
        stock: { store1: 59, store2: 20 },
        minStock: 11,
        supplier: "Castillo-Wilson",
        createdAt: "2024-07-18",
        updatedAt: "2025-04-15",
    },
    {
        id: "P010",
        name: { en: "Juice", si: "සිංහල_Juice" },
        description: { en: "High quality juice", si: "ඉතා උසස් සිංහල_Juice" },
        category: "Beverages",
        barcode: "2612587920",
        price: 13.45,
        cost: 9.28,
        stock: { store1: 15, store2: 67 },
        minStock: 19,
        supplier: "Nguyen Inc",
        createdAt: "2024-09-25",
        updatedAt: "2025-05-10",
    },
    {
        id: "P011",
        name: { en: "Bread", si: "සිංහල_Bread" },
        description: { en: "High quality bread", si: "ඉතා උසස් සිංහල_Bread" },
        category: "Snacks",
        barcode: "9160738439",
        price: 3.19,
        cost: 2.14,
        stock: { store1: 52, store2: 71 },
        minStock: 15,
        supplier: "Francis, Briggs and Norton",
        createdAt: "2024-09-09",
        updatedAt: "2025-05-25",
    },
    {
        id: "P012",
        name: { en: "Notebook", si: "සිංහල_Notebook" },
        description: { en: "High quality notebook", si: "ඉතා උසස් සිංහල_Notebook" },
        category: "Stationery",
        barcode: "1136859074",
        price: 8.22,
        cost: 6.5,
        stock: { store1: 77, store2: 74 },
        minStock: 13,
        supplier: "Rodriguez, Gill and Bowman",
        createdAt: "2024-08-03",
        updatedAt: "2025-05-13",
    },
    {
        id: "P013",
        name: { en: "Speaker", si: "සිංහල_Speaker" },
        description: { en: "High quality speaker", si: "ඉතා උසස් සිංහල_Speaker" },
        category: "Electronics",
        barcode: "6534112131",
        price: 48.72,
        cost: 31.25,
        stock: { store1: 38, store2: 43 },
        minStock: 13,
        supplier: "Harrison Group",
        createdAt: "2024-06-17",
        updatedAt: "2025-05-31",
    },
    {
        id: "P014",
        name: { en: "Pen", si: "සිංහල_Pen" },
        description: { en: "High quality pen", si: "ඉතා උසස් සිංහල_Pen" },
        category: "Stationery",
        barcode: "2929921247",
        price: 2.71,
        cost: 1.78,
        stock: { store1: 39, store2: 66 },
        minStock: 16,
        supplier: "Mcdonald Inc",
        createdAt: "2024-10-28",
        updatedAt: "2025-05-14",
    },
    {
        id: "P015",
        name: { en: "Bottle", si: "සිංහල_Bottle" },
        description: { en: "High quality bottle", si: "ඉතා උසස් සිංහල_Bottle" },
        category: "Beverages",
        barcode: "9500803211",
        price: 6.95,
        cost: 5.05,
        stock: { store1: 88, store2: 17 },
        minStock: 5,
        supplier: "Mitchell, Lewis and Gregory",
        createdAt: "2024-10-23",
        updatedAt: "2025-06-12",
    },
    // Continue this pattern until P032...
]



// using your creative ui ux skills create me dashboard to show total products , today selling , today profit , number of low stocks , dowload a inventory pdf. beatiful , colorful page