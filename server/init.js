import pool from './db.js';
import { hashPassword } from './auth.js';

export const initializeDB = async () => {
  try {
    console.log('Initializing database tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC NOT NULL,
        image TEXT NOT NULL,
        images TEXT[] DEFAULT '{}',
        category TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        featured BOOLEAN DEFAULT false,
        sizes TEXT[] DEFAULT '{}',
        colors TEXT[] DEFAULT '{}',
        date TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD')
      );
    `);

    // Migration to add the 'date' column if it doesn't exist
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD');
    `);

    // Migration to add the 'images' column if it doesn't exist
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        items JSONB NOT NULL,
        total NUMERIC NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        "customerName" TEXT NOT NULL,
        address TEXT NOT NULL,
        contact TEXT NOT NULL,
        "paymentMethod" TEXT NOT NULL,
        date TEXT NOT NULL,
        "expectedDeliveryDate" TEXT NOT NULL
      );
    `);

    // Settings table for store configuration (installation fee, etc.)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seed default installation fee if not already set
    await pool.query(`
      INSERT INTO settings (key, value)
      VALUES ('installation_fee', '0')
      ON CONFLICT (key) DO NOTHING;
    `);

    // Migration: add installation_fee column to products if missing
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS installation_fee NUMERIC DEFAULT 0;
    `);

    // Migration: add rating and feedback columns if missing
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating INTEGER;
    `);
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback TEXT;
    `);

    // Migration: add installment_plan column if missing
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS installment_plan JSONB DEFAULT NULL;
    `);

    // Migration: add installation_selected and installation_fee columns to orders if missing
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS installation_selected BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS installation_fee NUMERIC DEFAULT 0;
    `);

    // Migration: add soft-delete columns (deleted, deleted_at) to products and orders
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TEXT DEFAULT NULL;
    `);
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TEXT DEFAULT NULL;
    `);

    // Create messages table for customer-to-admin chat
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "senderId" TEXT NOT NULL,
        "senderName" TEXT NOT NULL,
        "senderRole" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "customerName" TEXT NOT NULL,
        "customerEmail" TEXT,
        "orderId" TEXT,
        content TEXT NOT NULL,
        "timestamp" TEXT NOT NULL DEFAULT to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS'),
        "isRead" BOOLEAN NOT NULL DEFAULT false
      );
    `);

    // Migration: add soft-delete columns (deleted, deleted_at) to messages
    await pool.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TEXT DEFAULT NULL;
    `);

    // Create users table for secure customer registration and authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        created_at TEXT NOT NULL DEFAULT to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')
      );
    `);

    // Seed default admin and customer with securely hashed passwords if not already present
    const defaultUsers = [
      { name: 'Rufino Admin', email: 'admin@rufinos.com', password: 'admin123', role: 'admin' },
      { name: 'Test Customer', email: 'customer@test.com', password: 'customer123', role: 'customer' }
    ];
    for (const u of defaultUsers) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length === 0) {
        const { hash, salt } = hashPassword(u.password);
        await pool.query(
          `INSERT INTO users (name, email, password_hash, salt, role) VALUES ($1, $2, $3, $4, $5)`,
          [u.name, u.email, hash, salt, u.role]
        );
      }
    }

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};
