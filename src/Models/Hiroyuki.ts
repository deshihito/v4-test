import { prisma } from "@/Models/db";
import TtlCache from "@/util/ttlCache";

async function loadHiroyukiByChannelId(channelId: string) {
  return await prisma.hiroyuki.findFirst({
    where: {
      channelId,
    },
  });
}

async function loadHiroyukiByGuildId(guildId: string) {
  return await prisma.hiroyuki.findFirst({
    where: {
      guildId,
    },
  });
}

type HiroyukiRow = Awaited<ReturnType<typeof loadHiroyukiByChannelId>>;

const byChannelCache = new TtlCache<HiroyukiRow>(60_000);
const byGuildCache = new TtlCache<HiroyukiRow>(60_000);

export function invalidateHiroyuki(): void {
  byChannelCache.clear();
  byGuildCache.clear();
}

export async function findHiroyukiByChannelId(channelId: string) {
  return byChannelCache.getOrLoad(channelId, () => loadHiroyukiByChannelId(channelId));
}

export async function findHiroyukiByGuildId(guildId: string) {
  return byGuildCache.getOrLoad(guildId, () => loadHiroyukiByGuildId(guildId));
}

export async function createHiroyuki(data: {
  channelId: string;
  guildId: string;
  webhookUrl: string;
}) {
  const created = await prisma.hiroyuki.create({ data });
  invalidateHiroyuki();
  return created;
}

export async function deleteHiroyukiByGuildId(guildId: string) {
  const deleted = await prisma.hiroyuki.delete({
    where: {
      guildId,
    },
  });
  invalidateHiroyuki();
  return deleted;
}

export async function deleteManyHiroyukiByGuildId(guildId: string) {
  const deleted = await prisma.hiroyuki.deleteMany({
    where: {
      guildId,
    },
  });
  invalidateHiroyuki();
  return deleted;
}
