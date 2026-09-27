import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
authRouter.use(authLimiter);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128)
});
const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128)
});

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('dm_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await User.exists({ email: data.email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with that email already exists.' });
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ name: data.name, email: data.email, passwordHash });
    setAuthCookie(res, user._id);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');
    const ok = user && await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Incorrect email or password.' });
    setAuthCookie(res, user._id);
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('dm_token', { path: '/' });
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
