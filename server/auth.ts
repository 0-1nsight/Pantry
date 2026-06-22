import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { EncryptJWT, jwtDecrypt, KeyLike } from 'jose';
import { query, queryOne } from './db.js';

const router = Router();
const SALT_ROUNDS = 10;

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: Date;
}

export interface Profile {
  id: string;
  username: string;
  created_at: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

// Initialize encryption key
async function getEncryptionKey(): Promise<KeyLike | Uint8Array> {
  const secret = process.env.JWE_SECRET_KEY || process.env.JWT_SECRET || 'dev-secret-change-in-production';
  const encoder = new TextEncoder();
  return encoder.encode(secret.padEnd(32, '0').slice(0, 32));
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

    // Create user with username in profiles table
    const userResult = await queryOne<{ id: string }>(
      `INSERT INTO auth.users (email, password_hash) VALUES ($1, $2) RETURNING id`,
      [email.toLowerCase(), passwordHash]
    );
    if (!userResult) throw new Error('User insert failed');

    // Create profile
    await query(
      `INSERT INTO auth.profiles (id, username) VALUES ($1, $2)`,
      [userResult.id, username.toLowerCase()]
    );

    const token = await createToken(userResult.id);
    res.json({ token, user: { id: userResult.id, email: email.toLowerCase(), username: username.toLowerCase() } });
  } catch (err: any) {
    if (err.code === '23505') {
      if (err.constraint === 'users_email_key') return res.status(400).json({ error: 'Email already registered' });
      if (err.constraint === 'profiles_username_key') return res.status(400).json({ error: 'Username already taken' });
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
    const user = await queryOne<{ id: string; email: string; password_hash: string }>(
      `SELECT id, email, password_hash FROM auth.users WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Fetch profile for username
    const profile = await queryOne<{ username: string }>(
      `SELECT username FROM auth.profiles WHERE id = $1`,
      [user.id]
    );

    const token = await createToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, username: profile?.username || '' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Get current user with profile
router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await queryOne<{ id: string; email: string; created_at: Date }>(
      `SELECT id, email, created_at FROM auth.users WHERE id = $1`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = await queryOne<{ username: string; created_at: Date }>(
      `SELECT username, created_at FROM auth.profiles WHERE id = $1`,
      [req.user.id]
    );

    res.json({ user: { id: user.id, email: user.email, username: profile?.username || '', created_at: user.created_at } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get profile
router.get('/profile', authMiddleware, async (req: any, res) => {
  try {
    const profile = await queryOne<Profile>(
      `SELECT id, username, created_at FROM auth.profiles WHERE id = $1`,
      [req.user.id]
    );
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
