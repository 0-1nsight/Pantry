import 'dotenv/config'; // <-- This loads your .env variables immediately before anything else runs
import express from 'express';
import cors from 'cors';
import authRoutes from './auth.js';
import itemsRoutes from './items.js';

const app = express();
const PORT = process.env.PORT || 3001; // Uncommented

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/items', itemsRoutes);

// Uncommented so the server actually starts up and listens for your React frontend!
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});