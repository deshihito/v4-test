import { prisma } from "@/Models/db";

/** 人間確認の状態を作成または更新する */
export async function upsertCheckHuman(userId: string, createdAt: Date) {
  return await prisma.checkHuman.upsert({
    where: {
      userId: userId,
    },
    update: {
      createdAt: createdAt,
    },
    create: {
      userId: userId,
    },
  });
}

/** 人間確認の状態を取得する */
export async function findCheckHuman(userId: string) {
  return await prisma.checkHuman.findUnique({
    where: {
      userId: userId,
    },
  });
}

/** 人間確認の状態を削除する */
export async function deleteCheckHuman(userId: string) {
  return await prisma.checkHuman.delete({
    where: {
      userId: userId,
    },
  });
}
