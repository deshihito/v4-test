import { prisma } from "@/Models/db";

/** 指定日時以降に作成されたWeb認証セッションを取得する */
export async function findRecentWebauthSession(userId: string, since: Date) {
  return await prisma.webauth.findFirst({
    where: {
      userId: userId,
      createdAt: {
        gte: since,
      },
    },
  });
}

/** Web認証セッションを作成する */
export async function createWebauth(data: {
  id: string;
  userId: string;
  guildId: string;
  roleId: string;
  interactionWebhookId: string;
}) {
  return await prisma.webauth.create({ data });
}

/** 指定日時より前に作成されたWeb認証セッションを削除する */
export async function deleteExpiredWebauth(before: Date) {
  return await prisma.webauth.deleteMany({
    where: {
      createdAt: {
        lt: before,
      },
    },
  });
}
