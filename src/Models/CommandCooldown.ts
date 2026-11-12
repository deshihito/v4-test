import { prisma } from "@/Models/db";

/** 指定日時より前に実行されたコマンドクールダウンを削除する */
export async function deleteExpiredCommandCooldown(before: Date) {
  return await prisma.commandCooldown.deleteMany({
    where: {
      executedAt: {
        lt: before,
      },
    },
  });
}
