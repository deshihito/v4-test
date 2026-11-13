import { prisma } from "@/Models/db";
import TtlCache from "@/util/ttlCache";

const notAfkCache = new TtlCache<boolean>(60_000);

export function invalidateAfk(userId: string): void {
  notAfkCache.delete(userId);
}

export async function findAfk(userId: string) {
  if (notAfkCache.get(userId)) return null;

  const row = await prisma.afk.findUnique({
    where: {
      userId,
    },
  });

  if (!row) notAfkCache.set(userId, true);

  return row;
}

export async function createAfk(userId: string, message: string) {
  const created = await prisma.afk.create({
    data: {
      userId,
      message,
    },
  });
  invalidateAfk(userId);
  return created;
}

export async function deleteAfk(userId: string) {
  const deleted = await prisma.afk.delete({
    where: {
      userId,
    },
  });
  notAfkCache.set(userId, true);
  return deleted;
}

export async function incrementAfkMention(userId: string) {
  return await prisma.afk.update({
    where: { userId },
    data: {
      mention: {
        increment: 1,
      },
    },
  });
}
