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

async function test() {
  try {
    console.log('Testing connection to:', process.env.DB_HOST || 'DATABASE_URL');
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);
    
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));
    
    if (tables.rows.some(r => r.table_name === 'products')) {
      const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
      console.log('Columns in products:', columns.rows);
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    await pool.end();
  }
}

test();
