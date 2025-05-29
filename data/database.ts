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
