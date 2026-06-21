import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { EncryptJWT, jwtDecrypt, generateKeyPair, KeyLike, ExportedKeyPair } from 'jose';
import { query, queryOne } from './db.js';

const router = Router();
const SALT_ROUNDS = 10;

let encryptionKey: KeyLike | Uint8Array;

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

// Initialize encryption key from env or generate
async function getEncryptionKey(): Promise<KeyLike | Uint8Array> {
  if (encryptionKey) return encryptionKey;

  const keyStr = process.env.JWE_SECRET_KEY;
  if (keyStr) {
    // Use provided key as uint8array
    const encoder = new TextEncoder();
    encryptionKey = encoder.encode(keyStr.padEnd(32, '0').slice(0, 32));
  } else {
    // Generate a determinstic key from JWT_SECRET for dev
    const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const encoder = new TextEncoder();
    encryptionKey = encoder.encode(secret.padEnd(32, '0').slice(0, 32));
  }
  return encryptionKey;
}

// Create JWE token
async function createToken(userId: string): Promise<string> {
  const key = await getEncryptionKey();
  return await new EncryptJWT({ userId })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .encrypt(key);
}

// Verify and decrypt JWE token
async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const key = await getEncryptionKey();
    const { payload } = await jwtDecrypt(token, key);
    return payload as { userId: string };
  } catch {
    return null;
  }
}

// Middleware to verify JWE
export async function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = auth.slice(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = { id: payload.userId } as User;
  next();
}

// Sign up
router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 characters, lowercase letters, numbers, underscore' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await queryOne<{ id: string }>(
      `INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id`,
      [email.toLowerCase(), passwordHash, username.toLowerCase()]
    );
    if (!result) throw new Error('Insert failed');
    const token = await createToken(result.id);
    res.json({ token, user: { id: result.id, email: email.toLowerCase(), username: username.toLowerCase() } });
  } catch (err: any) {
    if (err.code === '23505') {
      if (err.constraint === 'users_email_key') return res.status(400).json({ error: 'Email already registered' });
      if (err.constraint === 'users_username_key') return res.status(400).json({ error: 'Username already taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await queryOne<{ id: string; email: string; password_hash: string; username: string }>(
      `SELECT id, email, password_hash, username FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = await createToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await queryOne<{ id: string; email: string; username: string; created_at: Date }>(
      `SELECT id, email, username, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
