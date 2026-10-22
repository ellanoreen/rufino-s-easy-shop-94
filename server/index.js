import express from 'express';
import cors from 'cors';
import { query } from './db.js';
import { initializeDB } from './init.js';
import { validatePassword, hashPassword, verifyPassword } from './auth.js';
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
    const { userId, admin } = req.query;

    if (admin === 'true') {
      // Admin path: returns ALL orders (no user filter)
      const result = await query('SELECT * FROM orders ORDER BY date DESC');
      return res.json(result.rows);
    }

    // Customer path: userId is REQUIRED
    if (!userId || String(userId).trim() === '') {
      return res.status(400).json({ error: 'userId is required.' });
    }

    // Return ONLY orders that belong to this specific customer
    const result = await query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY date DESC`,
      [String(userId)]
    );
    return res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, total, status, customerName, address, contact, paymentMethod, date, expectedDeliveryDate, installmentPlan, installationSelected, installationFee, userId } = req.body;
    const result = await query(
      `INSERT INTO orders (items, total, status, "customerName", address, contact, "paymentMethod", date, "expectedDeliveryDate", installment_plan, installation_selected, installation_fee, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [JSON.stringify(items), total, status, customerName, address, contact, paymentMethod, date, expectedDeliveryDate,
       installmentPlan ? JSON.stringify(installmentPlan) : null, installationSelected ?? false, installationFee ?? 0, userId || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;

    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const order = orderResult.rows[0];

    if (status === 'Cancelled') {
      if (order.status !== 'Pending') {
        return res.status(400).json({ error: 'Order can only be cancelled when its status is Pending.' });
      }
      if (userId && order.user_id && String(order.user_id) !== String(userId)) {
        return res.status(403).json({ error: 'Forbidden: You can only cancel your own orders.' });
      }
    }

    // Prevent no-op updates
    if (order.status === status) {
      return res.json(order);
    }

    const result = await query(
      `UPDATE orders SET status=$1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    const updatedOrder = result.rows[0];

    // Create a notification for the order owner (if the order has a user_id)
    if (updatedOrder.user_id) {
      const statusMessages = {
        'Confirm':          'Your order has been confirmed by the store.',
        'Out for Delivery': 'Great news! Your order is now out for delivery.',
        'Delivered':        'Your order has been delivered. Enjoy your furniture!',
        'Cancelled':        'Your order has been cancelled.',
        'Pending':          'Your order status has been updated to Pending.',
      };
      const message = statusMessages[status] || `Your order status has been updated to ${status}.`;

      // Avoid duplicate notification for the same order + status
      const existing = await query(
        `SELECT id FROM notifications WHERE order_id = $1 AND status = $2 AND user_id = $3`,
        [String(id), status, String(updatedOrder.user_id)]
      );
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO notifications (user_id, order_id, message, status)
           VALUES ($1, $2, $3, $4)`,
          [String(updatedOrder.user_id), String(id), message, status]
        );
      }
    }

    res.json(updatedOrder);
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
    const { rating, feedback, userId } = req.body;

    // 1. Require a userId to identify the submitting customer
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: userId is required.' });
    }

    // 2. Fetch the order to validate ownership and prior submission
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const order = orderResult.rows[0];

    // 3. Only the customer who placed the order may submit feedback
    if (order.user_id !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden: You can only rate your own orders.' });
    }

    // 4. Cancelled orders cannot be rated
    if (order.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cancelled orders cannot be rated.' });
    }

    // 5. Prevent re-submission — one feedback per order
    if (order.rating !== null && order.rating !== undefined) {
      return res.status(409).json({ error: 'Feedback has already been submitted for this order.' });
    }

    // 6. Validate rating range
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // 7. Save rating, feedback text, and the submission timestamp
    const feedbackDate = new Date().toISOString();
    const result = await query(
      `UPDATE orders SET rating=$1, feedback=$2, feedback_date=$3 WHERE id = $4 RETURNING *`,
      [ratingNum, feedback || '', feedbackDate, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Notifications Routes ---
app.get('/api/notifications', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [String(userId)]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    const result = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, String(userId)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notifications/read-all', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [String(userId)]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notifications/:id/unread', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    const result = await query(
      `UPDATE notifications SET is_read = false WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, String(userId)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found.' });
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

// --- Messages / Chat Routes ---
app.get('/api/messages', async (req, res) => {
  try {
    const { customerId } = req.query;
    let result;
    if (customerId) {
      result = await query(
        `SELECT * FROM messages WHERE "customerId" = $1 AND (deleted IS NOT TRUE) ORDER BY "timestamp" ASC`,
        [customerId]
      );
    } else {
      result = await query('SELECT * FROM messages WHERE (deleted IS NOT TRUE) ORDER BY "timestamp" ASC');
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, senderName, senderRole, customerId, customerName, customerEmail, orderId, content } = req.body;
    const timestamp = new Date().toISOString();
    const result = await query(
      `INSERT INTO messages ("senderId", "senderName", "senderRole", "customerId", "customerName", "customerEmail", "orderId", content, "timestamp", "isRead")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) RETURNING *`,
      [senderId, senderName, senderRole, customerId, customerName, customerEmail || null, orderId || null, content, timestamp]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/messages/read', async (req, res) => {
  try {
    const { customerId, readerRole } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }
    const targetSenderRole = readerRole === 'admin' ? 'customer' : 'admin';
    const result = await query(
      `UPDATE messages SET "isRead" = true WHERE "customerId" = $1 AND "senderRole" = $2 RETURNING *`,
      [customerId, targetSenderRole]
    );
    res.json({ updatedCount: result.rowCount, messages: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/messages/unread', async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }
    const result = await query(
      `UPDATE messages SET "isRead" = false WHERE "customerId" = $1 AND "senderRole" = 'customer' RETURNING *`,
      [customerId]
    );
    res.json({ updatedCount: result.rowCount, messages: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/messages/conversation/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }
    const deletedAt = new Date().toISOString();
    const result = await query(
      `UPDATE messages SET deleted = true, deleted_at = $1 WHERE "customerId" = $2 RETURNING *`,
      [deletedAt, customerId]
    );
    res.json({ success: true, archivedCount: result.rowCount, deletedAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Auth Routes ---
app.post('/api/auth/validate-password', (req, res) => {
  const { password } = req.body;
  const result = validatePassword(password);
  res.json(result);
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Server-side strong password validation
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements.',
        errors: validation.errors,
        criteria: validation.criteria,
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Check for existing user
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Never store plain text passwords. Use scrypt secure hashing with random salt.
    const { hash, salt } = hashPassword(password);

    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, salt, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, role, created_at`,
      [cleanName, cleanEmail, hash, salt]
    );

    res.status(201).json({
      message: 'Account created successfully',
      user: insertResult.rows[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = verifyPassword(password, user.password_hash, user.salt);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during login.' });
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
