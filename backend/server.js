import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('../'));

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'غير مصرح' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'توكن غير صالح' });
  }
};

// ============ AUTH ROUTES ============

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============ CONTACT REQUESTS ROUTES ============

// Create Contact Request (Public)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, subject, budget, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
    }
    
    if (message.length < 30) {
      return res.status(400).json({ error: 'الرسالة يجب أن تكون 30 حرف على الأقل' });
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
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.status(201).json({ success: true, message: 'تم إرسال رسالتك بنجاح', id: request.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// Get All Requests (Admin)
app.get('/api/requests', auth, async (req, res) => {
  try {
    const { status, search } = req.query;
    
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const requests = await prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});


// Get Single Request (Admin)
app.get('/api/requests/:id', auth, async (req, res) => {
  try {
    const request = await prisma.contactRequest.findUnique({
      where: { id: req.params.id }
    });
    
    if (!request) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// Update Request Status (Admin)
app.patch('/api/requests/:id', auth, async (req, res) => {
  try {
    const { status, notes, assignedTo } = req.body;
    
    const request = await prisma.contactRequest.update({
      where: { id: req.params.id },
      data: { status, notes, assignedTo }
    });
    
    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: 'ContactRequest',
        entityId: req.params.id,
        action: 'UPDATE_STATUS',
        performedBy: req.user.id,
        metadata: { status, notes }
      }
    });
    
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// Delete Request (Admin)
app.delete('/api/requests/:id', auth, async (req, res) => {
  try {
    await prisma.contactRequest.delete({
      where: { id: req.params.id }
    });
    
    res.json({ success: true, message: 'تم حذف الطلب' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// Get Stats (Admin)
app.get('/api/stats', auth, async (req, res) => {
  try {
    const [total, newCount, pending, completed] = await Promise.all([
      prisma.contactRequest.count(),
      prisma.contactRequest.count({ where: { status: 'جديد' } }),
      prisma.contactRequest.count({ where: { status: 'قيد المراجعة' } }),
      prisma.contactRequest.count({ where: { status: 'تم التواصل' } })
    ]);
    
    res.json({ total, new: newCount, pending, completed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============ SEED ADMIN USER ============
async function seedAdmin() {
  const exists = await prisma.adminUser.findUnique({
    where: { email: 'admin@mohamed.dev' }
  });
  
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.adminUser.create({
      data: {
        name: 'محمد طايل',
        email: 'admin@mohamed.dev',
        passwordHash: hash,
        role: 'admin'
      }
    });
    console.log('✅ Admin user created: admin@mohamed.dev / admin123');
  }
}

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await seedAdmin();
});
