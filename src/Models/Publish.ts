import { prisma } from "@/Models/db";

/** アナウンス自動公開設定をチャンネルIDで取得する */
export async function findPublish(channelId: string) {
  return await prisma.publish.findUnique({
    where: {
      channelId: channelId,
    },
  });
}

/** アナウンス自動公開設定を作成する */
export async function createPublish(channelId: string, guildId: string) {
  return await prisma.publish.create({
    data: {
      channelId: channelId,
      guildId: guildId,
    },
  });
}

/** アナウンス自動公開設定を削除する */
export async function deletePublish(channelId: string) {
  return await prisma.publish.delete({
    where: {
      channelId: channelId,
    },
  });
}

/** サーバーのアナウンス自動公開設定一覧を取得する */
export async function listPublishesByGuild(guildId: string) {
  return await prisma.publish.findMany({
    where: {
      guildId: guildId,
    },
  });
}
