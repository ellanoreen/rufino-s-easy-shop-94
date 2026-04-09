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
        category TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        featured BOOLEAN DEFAULT false,
        sizes TEXT[] DEFAULT '{}',
        colors TEXT[] DEFAULT '{}'
      );
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

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};
