import { prisma } from "@/Models/db";

/** サーバーの統計情報を取得する */
export async function findGuildStatistics(guildId: string) {
  return await prisma.guildStatistics.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** サーバーの統計情報を作成する */
export async function createGuildStatistics(guildId: string) {
  return await prisma.guildStatistics.create({
    data: {
      guildId: guildId,
    },
  });
}

/** サーバーの統計情報を削除する */
export async function deleteGuildStatistics(guildId: string) {
  return await prisma.guildStatistics.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** 参加数を1増やす */
export async function incrementGuildStatisticsTotalJoin(guildId: string) {
  return await prisma.guildStatistics.update({
    where: {
      guildId: guildId,
    },
    data: {
      totalJoin: {
        increment: 1,
      },
    },
  });
}

/** 脱退数を1増やす */
export async function incrementGuildStatisticsTotalLeave(guildId: string) {
  return await prisma.guildStatistics.update({
    where: {
      guildId: guildId,
    },
    data: {
      totalLeave: {
        increment: 1,
      },
    },
  });
}

/** メッセージ数を1増やす */
export async function incrementGuildStatisticsTotalMessage(guildId: string) {
  return await prisma.guildStatistics.update({
    where: {
      guildId: guildId,
    },
    data: {
      totalMessage: {
        increment: 1,
      },
    },
  });
}

/** 全サーバーの統計情報をリセットする */
export async function resetAllGuildStatistics() {
  return await prisma.guildStatistics.updateMany({
    data: {
      totalJoin: 0,
      totalLeave: 0,
      totalMessage: 0,
    },
  });
}
