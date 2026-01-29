import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import statsRoutes from './routes/stats.routes.js';
import prisma from './lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.join(__dirname, '../../');

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_ROOT));

if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(FRONTEND_ROOT, 'index.html'));
});

app.get('/admin', (_req: Request, res: Response) => {
  res.sendFile(path.join(FRONTEND_ROOT, 'admin.html'));
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Resource not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Something went wrong on our side',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = Number(process.env.PORT) || 3000;

export default app;

if (process.env.NODE_ENV !== 'production') {
  async function startServer() {
    try {
      await prisma.$connect();
      console.log('Connected to the database');

      app.listen(PORT, () => {
        console.log(
          [
            'Mohamed Tayel Portfolio Backend',
            `Server:  http://localhost:${PORT}`,
            `Admin:   http://localhost:${PORT}/admin`,
            `API:     http://localhost:${PORT}/api`
          ].join('\n')
        );
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  const gracefulShutdown = async () => {
    console.log('\nShutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  startServer();
}
