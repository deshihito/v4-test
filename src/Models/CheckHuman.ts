import { prisma } from "@/Models/db";

/** 人間確認の状態を削除する */
export async function deleteCheckHuman(userId: string) {
  return await prisma.checkHuman.delete({
    where: {
      userId: userId,
    },
  });
}
