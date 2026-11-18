import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Expense Manager REST API is running on Node.js + Express + TypeScript!'
  });
});

// 2. Login Endpoint
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const [rows]: any = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    res.json({ status: 'success', user: rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. Get Transactions for User
app.get('/api/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    res.json({ status: 'success', data: rows });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. Add New Transaction
app.post('/api/transactions', async (req: Request, res: Response) => {
  try {
    const { user_id, title, amount, type, category, transaction_date } = req.body;
    if (!user_id || !title || !amount || !type || !category) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const dateValue = transaction_date || new Date().toISOString().split('T')[0];

    const [result]: any = await pool.query(
      'INSERT INTO transactions (user_id, title, amount, type, category, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, amount, type, category, dateValue]
    );

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      id: result.insertId
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. Update Transaction
app.put('/api/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, amount, type, category, transaction_date } = req.body;

    const [result]: any = await pool.query(
      'UPDATE transactions SET title = ?, amount = ?, type = ?, category = ?, transaction_date = ? WHERE id = ?',
      [title, amount, type, category, transaction_date, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }

    res.json({ status: 'success', message: 'Transaction updated successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 6. Delete Transaction
app.delete('/api/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [result]: any = await pool.query('DELETE FROM transactions WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }

    res.json({ status: 'success', message: 'Transaction deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;