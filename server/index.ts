import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.js';
import itemsRoutes from './items.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/items', itemsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
