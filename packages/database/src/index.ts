/**
 * @ramesh/database
 *
 * Exposes a single shared Prisma client instance so every backend module
 * reuses one connection pool instead of instantiating its own. Import
 * `db` from here rather than constructing `new PrismaClient()` elsewhere.
 *
 * No feature code yet — scaffold-only. Once prisma/schema.prisma has
 * models, run `npm run prisma:generate --workspace=@ramesh/database`.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
