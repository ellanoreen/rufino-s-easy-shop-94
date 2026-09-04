import pool from './db.js';

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

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};
