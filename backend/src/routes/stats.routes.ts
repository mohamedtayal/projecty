import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
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
      completed: contacted + closed
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Unable to load statistics' });
  }
});

router.get('/subjects', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.contactRequest.groupBy({
      by: ['subject'],
      _count: { subject: true },
      orderBy: { _count: { subject: 'desc' } }
    });

    res.json(
      subjects.map(subject => ({
        subject: subject.subject,
        count: subject._count.subject
      }))
    );
  } catch (error) {
    console.error('Get subject stats error:', error);
    res.status(500).json({ error: 'Unable to load subject statistics' });
  }
});

router.get('/budgets', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const budgets = await prisma.contactRequest.groupBy({
      by: ['budget'],
      _count: { budget: true },
      orderBy: { _count: { budget: 'desc' } }
    });

    res.json(
      budgets.map(entry => ({
        budget: entry.budget || 'Not specified',
        count: entry._count.budget
      }))
    );
  } catch (error) {
    console.error('Get budget stats error:', error);
    res.status(500).json({ error: 'Unable to load budget statistics' });
  }
});

router.get('/timeline', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.max(parseInt(req.query.days as string, 10) || 30, 1);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const requests = await prisma.contactRequest.findMany({
      where: { createdAt: { gte: daysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const timeline: Record<string, number> = {};

    requests.forEach(request => {
      const dateKey = request.createdAt.toISOString().split('T')[0];
      timeline[dateKey] = (timeline[dateKey] || 0) + 1;
    });

    res.json(
      Object.entries(timeline).map(([date, count]) => ({
        date,
        count
      }))
    );
  } catch (error) {
    console.error('Get timeline stats error:', error);
    res.status(500).json({ error: 'Unable to load timeline statistics' });
  }
});

export default router;
