// ============================================
// Mohamed Tayel Portfolio - Backend Server
// Express + TypeScript + Prisma
// ============================================

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import statsRoutes from './routes/stats.routes.js';

// Prisma Client
import prisma from './lib/prisma.js';

// ES Module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// ============================================
// Middleware
// ============================================

// CORS - Allow all origins for API
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from parent directory (frontend)
app.use(express.static(path.join(__dirname, '../../')));

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// API Routes
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// Serve Frontend
// ============================================

// Serve index.html for root
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Serve admin.html
app.get('/admin', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../admin.html'));
});

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'المسار غير موجود' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'خطأ في الخادم',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// Start Server (Local) / Export for Vercel
// ============================================

const PORT = process.env.PORT || 3000;

// For Vercel serverless
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  async function startServer() {
    try {
      await prisma.$connect();
      console.log('✅ Connected to database');
      
      app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════╗
║   🚀 Mohamed Tayel Portfolio Backend       ║
╠════════════════════════════════════════════╣
║   Server:  http://localhost:${PORT}           ║
║   Admin:   http://localhost:${PORT}/admin     ║
║   API:     http://localhost:${PORT}/api       ║
╚════════════════════════════════════════════╝
        `);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  });

  startServer();
}
