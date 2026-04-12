import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool(
  process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
      }
);

async function testInsert() {
  try {
    const name = "Test Product";
    const description = "Test Description";
    const price = 100;
    const image = "data:image/jpeg;base64,..."; // small fake image
    const category = "Living Room";
    const stock = 10;
    const featured = false;
    const sizes = ["M", "L"];
    const colors = ["Red", "Blue"];

    console.log('Attempting insert...');
    const result = await pool.query(
      `INSERT INTO products (name, description, price, image, category, stock, featured, sizes, colors) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, description, price, image, category, stock, featured, sizes, colors]
    );
    console.log('Insert successful:', result.rows[0]);
  } catch (err) {
    console.error('Insert failed!');
    console.error('Message:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.code) console.error('Code:', err.code);
    if (err.stack) console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
}

testInsert();
