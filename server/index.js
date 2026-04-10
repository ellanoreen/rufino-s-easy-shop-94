import express from 'express';
import cors from 'cors';
import { query } from './db.js';
import { initializeDB } from './init.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Init DB
initializeDB();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// --- Products Routes ---
app.get('/api/products', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, image, category, stock, featured = false, sizes, colors } = req.body;
    const result = await query(
      `INSERT INTO products (name, description, price, image, category, stock, featured, sizes, colors) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, description, price, image, category, stock, featured, sizes || [], colors || []]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, stock, featured = false, sizes, colors } = req.body;
    const result = await query(
      `UPDATE products SET name=$1, description=$2, price=$3, image=$4, category=$5, stock=$6, featured=$7, sizes=$8, colors=$9
       WHERE id = $10 RETURNING *`,
      [name, description, price, image, category, stock, featured, sizes || [], colors || [], id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Orders Routes ---
app.get('/api/orders', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, total, status, customerName, address, contact, paymentMethod, date, expectedDeliveryDate } = req.body;
    const result = await query(
      `INSERT INTO orders (items, total, status, "customerName", address, contact, "paymentMethod", date, "expectedDeliveryDate")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [JSON.stringify(items), total, status, customerName, address, contact, paymentMethod, date, expectedDeliveryDate]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await query(
      `UPDATE orders SET status=$1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
