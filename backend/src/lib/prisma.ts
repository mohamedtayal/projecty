// ============================================
// Prisma Client Configuration
// ============================================

import { PrismaClient } from '@prisma/client';

// إنشاء Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
};

// TypeScript type للـ Client
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// Global variable للحفاظ على instance واحد
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// استخدام Singleton Pattern لتجنب إنشاء connections متعددة
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
