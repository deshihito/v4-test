import { prisma } from "@/Models/db";
import TtlCache from "@/util/ttlCache";

async function loadPin(channelId: string) {
  return await prisma.pin.findUnique({
    where: {
      channelId: channelId,
    },
  });
}

type PinRow = Awaited<ReturnType<typeof loadPin>>;

const pinCache = new TtlCache<PinRow>(60_000);

export function invalidatePin(channelId: string): void {
  pinCache.delete(channelId);
}

export function invalidateAllPins(): void {
  pinCache.clear();
}

/** ピン設定をチャンネルIDで取得する */
export async function findPin(channelId: string) {
  return pinCache.getOrLoad(channelId, () => loadPin(channelId));
}

/** ピン設定を作成する */
export async function createPin(
  channelId: string,
  messegeId: string,
  guildId: string,
  webhookUrl: string,
) {
  const created = await prisma.pin.create({
    data: {
      channelId: channelId,
      messegeId: messegeId,
      guildId: guildId,
      webhookUrl: webhookUrl,
    },
  });
  invalidatePin(channelId);
  return created;
}

/** ピン設定のメッセージIDを更新する */
export async function updatePinMessageId(channelId: string, messegeId: string) {
  const updated = await prisma.pin.update({
    where: { channelId: channelId },
    data: {
      messegeId: messegeId,
    },
  });
  const cached = pinCache.get(channelId);
  if (cached) pinCache.set(channelId, { ...cached, messegeId });
  return updated;
}

/** ピン設定を削除する */
export async function deletePin(channelId: string) {
  const deleted = await prisma.pin.delete({
    where: {
      channelId: channelId,
    },
  });
  invalidatePin(channelId);
  return deleted;
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
