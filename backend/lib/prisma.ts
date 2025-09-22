import { PrismaClient } from "@prisma/client";

// Экземпляр Prisma для использования в проекте
export const prisma = new PrismaClient();

// Тип PrismaClient для TS
export type { PrismaClient };
