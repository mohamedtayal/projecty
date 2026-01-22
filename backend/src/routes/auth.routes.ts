// ============================================
// Authentication Routes
// ============================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================
// POST /api/auth/login - تسجيل الدخول
// ============================================
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // التحقق من البيانات
    if (!email || !password) {
      res.status(400).json({ error: 'البريد وكلمة المرور مطلوبان' });
      return;
    }
    
    // البحث عن المستخدم
    const user = await prisma.adminUser.findUnique({
      where: { email }
    });
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      return;
    }
    
    // التحقق من كلمة المرور
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      return;
    }
    
    // تحديث آخر تسجيل دخول
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // إنشاء JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
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
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================
// GET /api/auth/me - بيانات المستخدم الحالي
// ============================================
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
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
