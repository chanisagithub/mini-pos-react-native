export interface Item {
    id?: number;
    name: string;
    category: ItemCategory;
    price: number;
    quantityInStock: number;
    lowStockThreshold?: number;
    // imageUri?: string; // Optional: if you plan to add images later
}

export enum ItemCategory {
    MAIN = 'Main',
    CURRIES = 'Curries',
    DESSERTS = 'Desserts',
    // Add more categories as needed
}