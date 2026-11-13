import { prisma } from "@/Models/db";
import TtlCache from "@/util/ttlCache";

const existsCache = new TtlCache<boolean>(60_000);

export function invalidateGuildStatistics(guildId: string): void {
  existsCache.delete(guildId);
}

/** サーバーの統計情報が存在するかどうかを確認する */
export async function existsGuildStatistics(guildId: string): Promise<boolean> {
  return existsCache.getOrLoad(guildId, async () => {
    const row = await prisma.guildStatistics.findUnique({
      where: {
        guildId: guildId,
      },
      select: {
        guildId: true,
      },
    });
    return row !== null;
  });
}

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
  const created = await prisma.guildStatistics.create({
    data: {
      guildId: guildId,
    },
  });
  invalidateGuildStatistics(guildId);
  return created;
}

/** サーバーの統計情報を削除する */
export async function deleteGuildStatistics(guildId: string) {
  const deleted = await prisma.guildStatistics.delete({
    where: {
      guildId: guildId,
    },
  });
  invalidateGuildStatistics(guildId);
  return deleted;
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

/** メッセージ数を増やす */
export async function incrementGuildStatisticsTotalMessage(guildId: string, count: number = 1) {
  return await prisma.guildStatistics.update({
    where: {
      guildId: guildId,
    },
    data: {
      totalMessage: {
        increment: count,
      },
    },
  });
}

const pendingMessages = new Map<string, number>();

/** メッセージ数をメモリ上に集計する (書き込みは flushGuildStatisticsMessages で行う) */
export function queueGuildStatisticsMessage(guildId: string): void {
  pendingMessages.set(guildId, (pendingMessages.get(guildId) ?? 0) + 1);
}

/** 集計中のメッセージ数をギルド別に取得する */
export function pendingGuildStatisticsMessages(): Map<string, number> {
  return new Map(pendingMessages);
}

/** 集計したメッセージ数をまとめて DB へ書き込む (失敗した分は集計に戻す) */
export async function flushGuildStatisticsMessages(): Promise<void> {
  if (pendingMessages.size === 0) return;

  const batch = new Map(pendingMessages);
  pendingMessages.clear();

  const failed: [string, number][] = [];

  await Promise.all(
    [...batch].map(async ([guildId, count]) => {
      try {
        await incrementGuildStatisticsTotalMessage(guildId, count);
      } catch {
        failed.push([guildId, count]);
      }
    }),
  );

  for (const [guildId, count] of failed) {
    pendingMessages.set(guildId, (pendingMessages.get(guildId) ?? 0) + count);
  }
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
