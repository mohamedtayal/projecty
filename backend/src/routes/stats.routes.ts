// ============================================
// Statistics Routes
// ============================================

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================
// GET /api/stats - إحصائيات لوحة التحكم (Admin)
// ============================================
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // جلب إحصائيات الطلبات
    const [total, newCount, inReview, contacted, closed, rejected] = await Promise.all([
      prisma.contactRequest.count(),
      prisma.contactRequest.count({ where: { status: 'NEW' } }),
      prisma.contactRequest.count({ where: { status: 'IN_REVIEW' } }),
      prisma.contactRequest.count({ where: { status: 'CONTACTED' } }),
      prisma.contactRequest.count({ where: { status: 'CLOSED' } }),
      prisma.contactRequest.count({ where: { status: 'REJECTED' } })
    ]);
    
    res.json({
      total,
      new: newCount,
      inReview,
      contacted,
      closed,
      rejected,
      completed: contacted + closed // تم التواصل والمغلق
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================
// GET /api/stats/subjects - إحصائيات حسب الموضوع (Admin)
// ============================================
router.get('/subjects', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.contactRequest.groupBy({
      by: ['subject'],
      _count: {
        subject: true
      },
      orderBy: {
        _count: {
          subject: 'desc'
        }
      }
    });
    
    res.json(subjects.map(s => ({
      subject: s.subject,
      count: s._count.subject
    })));
  } catch (error) {
    console.error('Get subjects stats error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================
// GET /api/stats/budgets - إحصائيات حسب الميزانية (Admin)
// ============================================
router.get('/budgets', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const budgets = await prisma.contactRequest.groupBy({
      by: ['budget'],
      _count: {
        budget: true
      },
      orderBy: {
        _count: {
          budget: 'desc'
        }
      }
    });
    
    res.json(budgets.map(b => ({
      budget: b.budget || 'غير محدد',
      count: b._count.budget
    })));
  } catch (error) {
    console.error('Get budgets stats error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================
// GET /api/stats/timeline - إحصائيات زمنية (Admin)
// ============================================
router.get('/timeline', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    const requests = await prisma.contactRequest.findMany({
      where: {
        createdAt: {
          gte: daysAgo
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // تجميع حسب اليوم
    const timeline: { [key: string]: number } = {};
    requests.forEach(r => {
      const date = r.createdAt.toISOString().split('T')[0];
      timeline[date] = (timeline[date] || 0) + 1;
    });
    
    res.json(Object.entries(timeline).map(([date, count]) => ({
      date,
      count
    })));
  } catch (error) {
    console.error('Get timeline stats error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
