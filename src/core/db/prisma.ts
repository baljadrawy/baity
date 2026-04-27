/**
 * Prisma Client Singleton — "بيتي"
 *
 * القاعدة: نستورد `prisma` دائماً من هذا الملف.
 * في development، نُعيد استخدام نفس الـ instance لمنع hot-reload connections.
 * في production، instance واحد فقط.
 *
 * @see https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
