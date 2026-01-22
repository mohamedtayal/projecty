// ============================================
// Contact Requests Routes
// ============================================

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { RequestStatus } from '@prisma/client';

const router = Router();

// ============================================
// POST /api/contact - إرسال طلب تواصل (Public)
// ============================================
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, company, subject, budget, message } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
      return;
    }
    
    // التحقق من طول الرسالة
    if (message.length < 30) {
      res.status(400).json({ error: 'الرسالة يجب أن تكون 30 حرف على الأقل' });
      return;
    }
    
    // التحقق من صحة البريد
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'البريد الإلكتروني غير صالح' });
      return;
    }
    
    // إنشاء الطلب في قاعدة البيانات
    const request = await prisma.contactRequest.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        subject,
        budget: budget || null,
        message,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح! سأتواصل معك قريباً',
      id: request.id
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================
// GET /api/contact - جلب جميع الطلبات (Admin)
// ============================================
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    
    // بناء شروط البحث
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status as RequestStatus;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { subject: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    
    // جلب البيانات مع العدد الإجمالي
    const [requests, total] = await Promise.all([
      prisma.contactRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.contactRequest.count({ where })
    ]);
    
    res.json({
      data: requests,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================
// GET /api/contact/:id - جلب طلب واحد (Admin)
// ============================================
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await prisma.contactRequest.findUnique({
      where: { id: req.params.id }
    });
    
    if (!request) {
      res.status(404).json({ error: 'الطلب غير موجود' });
      return;
    }
    
    res.json(request);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================
// PATCH /api/contact/:id - تحديث حالة الطلب (Admin)
// ============================================
router.patch('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, notes, assignedTo } = req.body;
    
    // التحقق من وجود الطلب
    const existing = await prisma.contactRequest.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existing) {
      res.status(404).json({ error: 'الطلب غير موجود' });
      return;
    }
    
    // تحديث الطلب
    const updated = await prisma.contactRequest.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status: status as RequestStatus }),
        ...(notes !== undefined && { notes }),
        ...(assignedTo !== undefined && { assignedTo })
      }
    });
    
    // إنشاء سجل تدقيق
    await prisma.auditLog.create({
      data: {
        entityType: 'ContactRequest',
        entityId: req.params.id,
        action: 'UPDATE',
        oldData: JSON.stringify(existing),
        newData: JSON.stringify(updated),
        performedBy: req.user!.id
      }
    });
    
    res.json({
      success: true,
      message: 'تم تحديث الطلب بنجاح',
      data: updated
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================
// DELETE /api/contact/:id - حذف طلب (Admin)
// ============================================
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // التحقق من وجود الطلب
    const existing = await prisma.contactRequest.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existing) {
      res.status(404).json({ error: 'الطلب غير موجود' });
      return;
    }
    
    // حذف الطلب
    await prisma.contactRequest.delete({
      where: { id: req.params.id }
    });
    
    // إنشاء سجل تدقيق
    await prisma.auditLog.create({
      data: {
        entityType: 'ContactRequest',
        entityId: req.params.id,
        action: 'DELETE',
        oldData: JSON.stringify(existing),
        performedBy: req.user!.id
      }
    });
    
    res.json({
      success: true,
      message: 'تم حذف الطلب بنجاح'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
