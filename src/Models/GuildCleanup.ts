import { prisma } from "@/Models/db";

/**
 * サーバー削除時に、そのサーバーの全データを削除する。
 * 削除したグローバルチャットの件数を返す。
 */
export async function deleteGuildData(guildId: string): Promise<number> {
  await prisma.joinNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.leaveNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.guildStatistics.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  const count = (
    await prisma.globalChat.deleteMany({
      where: {
        guildId: guildId,
      },
    })
  ).count;

  await prisma.hiroyuki.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.publish.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.pin.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.bumpNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.dissokuNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.upNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.bumpNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.dissokuNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.upNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.voteNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.voteNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.dicoallNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.dicoallNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.dcafeNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.dcafeNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.sharkbotNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.sharkbotNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.dsioNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.dsioNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.discomNotice.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  await prisma.discomNoticeIgnore.deleteMany({
    where: {
      guildId: guildId,
    },
  });

  return count;
}
