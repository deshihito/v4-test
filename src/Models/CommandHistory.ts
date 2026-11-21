import { prisma } from "@/Models/db";

export async function createCommandHistory(data: {
  userId: string;
  channelId: string;
  guildId: string;
  name: string;
  option: string;
}) {
  return await prisma.commandHistory.create({ data });
}

/** 指定日時以降に実行されたコマンドの数を数える */
export async function countCommandHistorySince(since: Date) {
  return await prisma.commandHistory.count({
    where: {
      executedAt: {
        gte: since,
      },
    },
  });
}
