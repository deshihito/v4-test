import { prisma } from "@/Models/db";
import type { LevelSettings } from "@/Views/levelSettingsPanel";

export async function grantLevelChatExp(
  userId: string,
  guildId: string,
  now: Date,
  grantExp: number,
  grantInterval: number,
) {
  return await prisma.levelUser.updateMany({
    where: {
      userId,
      guildId,
      OR: [
        { lastChatGrant: null },
        { lastChatGrant: { lt: new Date(now.getTime() - grantInterval) } },
      ],
    },
    data: {
      chatExp: { increment: grantExp },
      lastChatGrant: now,
    },
  });
}

export async function findLevelUser(userId: string, guildId: string) {
  return await prisma.levelUser.findUnique({
    where: { userId_guildId: { userId, guildId } },
  });
}

export async function createLevelUser(data: {
  userId: string;
  guildId: string;
  chatExp: number;
  lastChatGrant: Date;
}) {
  return await prisma.levelUser.create({ data });
}

export async function countLevelUsersAboveExp(guildId: string, chatExp: number) {
  return await prisma.levelUser.count({
    where: {
      guildId,
      chatExp: { gt: chatExp },
    },
  });
}

export async function queryLevelUserTotalExp(userId: string) {
  return await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("chatExp"), 0)::int AS "total"
      FROM "levelUser"
      WHERE "userId" = ${userId}`;
}

export async function countLevelUsersByTotalExpAbove(totalExp: number) {
  return await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS "count"
      FROM (
        SELECT "userId"
        FROM "levelUser"
        GROUP BY "userId"
        HAVING SUM("chatExp") > ${totalExp}
      ) AS "totals"`;
}

export async function findLevelSetting(userId: string) {
  return await prisma.levelSetting.findUnique({
    where: { userId },
  });
}

export async function findLevelGuildSetting(guildId: string) {
  return await prisma.levelGuildSetting.findUnique({
    where: { guildId },
  });
}

export async function upsertLevelGuildSettingNotifyChannel(
  guildId: string,
  notifyChannelId: string | null,
) {
  return await prisma.levelGuildSetting.upsert({
    where: { guildId },
    create: { guildId, notifyChannelId },
    update: { notifyChannelId },
  });
}

export async function toggleLevelSetting(userId: string, column: string) {
  return await prisma.$queryRawUnsafe<LevelSettings[]>(
    `INSERT INTO "levelSetting" ("userId", ${column}, "updatedAt", "registeredAt")
       VALUES ($1, false, NOW(), NOW())
       ON CONFLICT ("userId")
       DO UPDATE SET ${column} = NOT "levelSetting".${column}, "updatedAt" = NOW()
       RETURNING "notify", "mention", "card"`,
    userId,
  );
}
