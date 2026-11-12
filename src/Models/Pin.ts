import { prisma } from "@/Models/db";

/** ピン設定をチャンネルIDで取得する */
export async function findPin(channelId: string) {
  return await prisma.pin.findUnique({
    where: {
      channelId: channelId,
    },
  });
}

/** ピン設定を作成する */
export async function createPin(
  channelId: string,
  messegeId: string,
  guildId: string,
  webhookUrl: string,
) {
  return await prisma.pin.create({
    data: {
      channelId: channelId,
      messegeId: messegeId,
      guildId: guildId,
      webhookUrl: webhookUrl,
    },
  });
}

/** ピン設定のメッセージIDを更新する */
export async function updatePinMessageId(channelId: string, messegeId: string) {
  return await prisma.pin.update({
    where: { channelId: channelId },
    data: {
      messegeId: messegeId,
    },
  });
}

/** ピン設定を削除する */
export async function deletePin(channelId: string) {
  return await prisma.pin.delete({
    where: {
      channelId: channelId,
    },
  });
}

/** サーバーのピン設定数を取得する */
export async function countPinsByGuild(guildId: string) {
  return await prisma.pin.count({
    where: {
      guildId: guildId,
    },
  });
}

/** サーバーのピン設定一覧を取得する */
export async function listPinsByGuild(guildId: string) {
  return await prisma.pin.findMany({
    where: {
      guildId: guildId,
    },
  });
}
