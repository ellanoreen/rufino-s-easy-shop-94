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

// --- Migrate legacy order statuses ---
(async () => {
  try {
    // Map old status values to the new status system
    const migrations = [
      { old: 'Shipped',    newStatus: 'Out for Delivery' },
      { old: 'Completed',  newStatus: 'Delivered' },
      { old: 'shipped',    newStatus: 'Out for Delivery' },
      { old: 'completed',  newStatus: 'Delivered' },
      { old: 'pending',    newStatus: 'Pending' },
      { old: 'confirmed',  newStatus: 'Confirmed' },
      { old: 'processing', newStatus: 'Confirmed' },
      { old: 'Processing', newStatus: 'Confirmed' },
      { old: 'delivered',  newStatus: 'Delivered' },
      { old: 'cancelled',  newStatus: 'Cancelled' },
    ];
    for (const { old, newStatus } of migrations) {
      const result = await query(
        `UPDATE orders SET status = $1 WHERE status = $2`,
        [newStatus, old]
      );
      if (result.rowCount > 0) {
        console.log(`Migrated ${result.rowCount} order(s) from status "${old}" → "${newStatus}"`);
      }
    }
    console.log('Order status migration complete.');
  } catch (err) {
    console.error('Order status migration failed:', err.message);
  }
})();

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
    const { name, description, price, image, images, category, stock, featured = false, sizes, colors, installationFee = 0 } = req.body;
    
    // ensure image is at least the first element of images if image is missing but images exists
    const mainImage = image || (images && images.length > 0 ? images[0] : '');

    const result = await query(
      `INSERT INTO products (name, description, price, image, images, category, stock, featured, sizes, colors, installation_fee) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, description, price, mainImage, images || [], category, stock, featured, sizes || [], colors || [], installationFee || 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ 
      error: error.message,
      detail: error.detail || 'Internal server error'
    });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, images, category, stock, featured = false, sizes, colors, installationFee = 0 } = req.body;
    
    const mainImage = image || (images && images.length > 0 ? images[0] : '');
    
    const result = await query(
      `UPDATE products SET name=$1, description=$2, price=$3, image=$4, images=$5, category=$6, stock=$7, featured=$8, sizes=$9, colors=$10, installation_fee=$11
       WHERE id = $12 RETURNING *`,
      [name, description, price, mainImage, images || [], category, stock, featured, sizes || [], colors || [], installationFee || 0, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: error.message,
      detail: error.detail || 'Internal server error'
    });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE products SET deleted = true, deleted_at = to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product archived successfully', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Orders Routes ---
app.get('/api/orders', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, total, status, customerName, address, contact, paymentMethod, date, expectedDeliveryDate, installmentPlan, installationSelected, installationFee } = req.body;
    const result = await query(
      `INSERT INTO orders (items, total, status, "customerName", address, contact, "paymentMethod", date, "expectedDeliveryDate", installment_plan, installation_selected, installation_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [JSON.stringify(items), total, status, customerName, address, contact, paymentMethod, date, expectedDeliveryDate,
       installmentPlan ? JSON.stringify(installmentPlan) : null, installationSelected ?? false, installationFee ?? 0]
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

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE orders SET deleted = true, deleted_at = to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order archived successfully', order: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const result = await query(
      `UPDATE orders SET rating=$1, feedback=$2 WHERE id = $3 RETURNING *`,
      [rating, feedback, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Settings Routes ---
app.get('/api/settings', async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const result = await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2 RETURNING *`,
      [key, String(value)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
