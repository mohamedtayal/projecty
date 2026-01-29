import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const INVALID_CREDENTIALS = 'Unable to authenticate with the provided credentials';

const sanitizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const sanitizePassword = (value: unknown): string =>
  typeof value === 'string' ? value : '';

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeEmail(req.body.email);
    const password = sanitizePassword(req.body.password);

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are both required' });
      return;
    }

    const user = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: INVALID_CREDENTIALS });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      res.status(401).json({ error: INVALID_CREDENTIALS });
      return;
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Unable to log in at the moment' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Administrator account could not be found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Unable to load the current user profile' });
  }
});

export default router;
