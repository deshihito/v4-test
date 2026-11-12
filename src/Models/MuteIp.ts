import { prisma } from "@/Models/db";

/** 指定日時より前に作成されたIPミュートを削除する */
export async function deleteExpiredMuteIp(before: Date) {
  return await prisma.muteIp.deleteMany({
    where: {
      createdAt: {
        lt: before,
      },
    },
  });
}
