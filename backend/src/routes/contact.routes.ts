import { Router, Request, Response } from 'express';
import { Prisma, RequestStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const sanitizeString = (value: unknown, maxLength = 255): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const optionalString = (value: unknown, maxLength = 255): string | null => {
  const sanitized = sanitizeString(value, maxLength);
  return sanitized || null;
};

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const name = sanitizeString(req.body.name, 120);
    const email = sanitizeString(req.body.email, 160).toLowerCase();
    const phone = optionalString(req.body.phone, 40);
    const company = optionalString(req.body.company, 160);
    const subject = sanitizeString(req.body.subject, 160);
    const budget = optionalString(req.body.budget, 120);
    const message = sanitizeString(req.body.message, 4000);

    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'Name, email, subject, and message are required' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Email address is not valid' });
      return;
    }

    if (message.length < 30) {
      res.status(400).json({ error: 'Please share at least 30 characters so we can understand your request' });
      return;
    }

    const request = await prisma.contactRequest.create({
      data: {
        name,
        email,
        phone,
        company,
        subject,
        budget,
        message,
        ipAddress: req.ip ?? null,
        userAgent: Array.isArray(req.headers['user-agent'])
          ? req.headers['user-agent'][0]
          : req.headers['user-agent'] ?? null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Your request has been received successfully',
      id: request.id
    });
  } catch (error) {
    console.error('Create contact request error:', error);
    res.status(500).json({ error: 'Unable to submit your request right now' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const where: Prisma.ContactRequestWhereInput = {};
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const statusQuery = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : '';

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (statusQuery && statusQuery !== 'ALL' && Object.values(RequestStatus).includes(statusQuery as RequestStatus)) {
      where.status = statusQuery as RequestStatus;
    }

    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.contactRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.contactRequest.count({ where })
    ]);

    res.json({
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List contact requests error:', error);
    res.status(500).json({ error: 'Unable to load contact requests' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await prisma.contactRequest.findUnique({
      where: { id: req.params.id }
    });

    if (!request) {
      res.status(404).json({ error: 'Contact request could not be found' });
      return;
    }

    res.json(request);
  } catch (error) {
    console.error('Get contact request error:', error);
    res.status(500).json({ error: 'Unable to load the contact request' });
  }
});

router.patch('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.contactRequest.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Contact request could not be found' });
      return;
    }

    const updates: Prisma.ContactRequestUpdateInput = {};

    if (typeof req.body.status === 'string') {
      const nextStatus = req.body.status.trim().toUpperCase();
      if (!Object.values(RequestStatus).includes(nextStatus as RequestStatus)) {
        res.status(400).json({ error: 'Status value is not valid' });
        return;
      }
      updates.status = nextStatus as RequestStatus;
    }

    if (req.body.notes !== undefined) {
      updates.notes = optionalString(req.body.notes, 2000);
    }

    if (req.body.assignedTo !== undefined) {
      updates.assignedTo = optionalString(req.body.assignedTo, 120);
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'Provide at least one field to update' });
      return;
    }

    const updated = await prisma.contactRequest.update({
      where: { id: req.params.id },
      data: updates
    });

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
      message: 'Contact request updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update contact request error:', error);
    res.status(500).json({ error: 'Unable to update the contact request' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.contactRequest.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Contact request could not be found' });
      return;
    }

    await prisma.contactRequest.delete({
      where: { id: req.params.id }
    });

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
      message: 'Contact request deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact request error:', error);
    res.status(500).json({ error: 'Unable to delete the contact request' });
  }
});

export default router;
