import { prisma } from "@/Models/db";

export async function findAfk(userId: string) {
  return await prisma.afk.findUnique({
    where: {
      userId,
    },
  });
}

export async function createAfk(userId: string, message: string) {
  return await prisma.afk.create({
    data: {
      userId,
      message,
    },
  });
}

export async function deleteAfk(userId: string) {
  return await prisma.afk.delete({
    where: {
      userId,
    },
  });
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
