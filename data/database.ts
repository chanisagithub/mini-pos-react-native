import * as SQLite from 'expo-sqlite';
import { Item } from '../models/item.model';
import { Order } from '../models/order.model';
import { OrderItem } from '../models/order-item.model';

const dbName = 'idiAappaKade.db';

let db: SQLite.SQLiteDatabase;

// Ensure DB is initialized
const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync(dbName);
  }
  return db;
};

/**
 * Initializes the database and creates necessary tables.
 */
export const initDatabase = async (): Promise<void> => {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      quantityInStock INTEGER NOT NULL,
      lowStockThreshold INTEGER DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      customerName TEXT NOT NULL,
      orderDate TEXT NOT NULL,
      totalAmount REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      orderId INTEGER NOT NULL,
      itemId INTEGER NOT NULL,
      itemName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      priceAtPurchase REAL NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items (id) ON DELETE RESTRICT
    );
  `);

  console.log('[DB] Database initialized successfully.');
};

/**
 * Adds a new item to the database.
*/
export const addItem = async (item: Omit<Item, 'id'>): Promise<number> => {
  const db = await getDb();

  const result = await db.runAsync(
    `INSERT INTO items (name, category, price, quantityInStock, lowStockThreshold)
     VALUES (?, ?, ?, ?, ?);`,
    item.name,
    item.category,
    item.price,
    item.quantityInStock,
    item.lowStockThreshold || 5
  );

  if (result.lastInsertRowId != null) {
    return result.lastInsertRowId;
  }

  throw new Error('Insert failed: No insertId returned.');
};

/**
 * Fetches all items.
 */
export const getItems = async (): Promise<Item[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<Item>('SELECT * FROM items ORDER BY name ASC;');
  return rows;
};

/**
 * Gets an item by its ID.
 */
export const getItemById = async (id: number): Promise<Item | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<Item>('SELECT * FROM items WHERE id = ?;', id);
  return row || null;
};

/**
 * Updates an existing item.
 */
export const updateItem = async (item: Item): Promise<number> => {
  if (!item.id) throw new Error('Item ID is required for update.');

  const db = await getDb();
  const result = await db.runAsync(
    `UPDATE items
     SET name = ?, category = ?, price = ?, quantityInStock = ?, lowStockThreshold = ?
     WHERE id = ?;`,
    item.name,
    item.category,
    item.price,
    item.quantityInStock,
    item.lowStockThreshold || 5,
    item.id
  );

  return result.rowsAffected ?? 0;
};

/**
 * Deletes an item by ID.
*/
export const deleteItem = async (id: number): Promise<number> => {
  const db = await getDb();

  const result = await db.runAsync(
    'DELETE FROM items WHERE id = ?;',
    id
  );

  return result.rowsAffected ?? 0;
};

/**
 * Represents an item added to the current order (before saving to DB).
 */
export interface CartItem extends Item {
  orderQuantity: number;
}

/**
 * Saves a complete order with associated items and updates stock.
 */
export const saveCompleteOrder = async (
  customerName: string,
  cartItems: CartItem[]
): Promise<number> => {
  const db = await getDb();

  if (cartItems.length === 0) {
    throw new Error('Cannot save an empty order.');
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.orderQuantity), 0);
  const orderDate = new Date().toISOString();

  try {
    await db.execAsync('BEGIN;');

    // Insert into orders table
    const orderResult = await db.runAsync(
      `INSERT INTO orders (customerName, orderDate, totalAmount) VALUES (?, ?, ?);`,
      customerName,
      orderDate,
      totalAmount
    );

    const newOrderId = orderResult.lastInsertRowId;
    if (newOrderId == null) throw new Error('Failed to insert order.');

    // Process each item
    for (const item of cartItems) {
      if (item.quantityInStock < item.orderQuantity) {
        throw new Error(`Not enough stock for item: ${item.name}`);
      }

      await db.runAsync(
        `INSERT INTO order_items (orderId, itemId, itemName, quantity, priceAtPurchase)
         VALUES (?, ?, ?, ?, ?);`,
        newOrderId,
        item.id,
        item.name,
        item.orderQuantity,
        item.price
      );

      const newStock = item.quantityInStock - item.orderQuantity;
      await db.runAsync(
        `UPDATE items SET quantityInStock = ? WHERE id = ?;`,
        newStock,
        item.id
      );
    }

    await db.execAsync('COMMIT;');
    return newOrderId;
  } catch (err) {
    console.error('[DB_LOG] saveCompleteOrder failed. Rolling back transaction.', err);
    await db.execAsync('ROLLBACK;');
    throw err;
  }
};


// --- Fetch all orders ---
export const getOrders = async (): Promise<Order[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<Order>('SELECT * FROM orders ORDER BY orderDate DESC;');
  return rows;
};

export const getOrderItemsByOrderId = async (orderId: number): Promise<OrderItem[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<OrderItem>(
    'SELECT * FROM order_items WHERE orderId = ?;',
    orderId
  );
  return rows;
};
