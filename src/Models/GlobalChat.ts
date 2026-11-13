import { prisma } from "@/Models/db";
import TtlCache from "@/util/ttlCache";

async function loadGlobalChatByChannelId(channelId: string) {
  return await prisma.globalChat.findFirst({
    where: {
      channelId,
    },
  });
}

async function loadGlobalChatByGuildId(guildId: string) {
  return await prisma.globalChat.findUnique({
    where: {
      guildId,
    },
  });
}

async function loadGlobalChats() {
  return await prisma.globalChat.findMany();
}

type GlobalChatRow = Awaited<ReturnType<typeof loadGlobalChatByChannelId>>;
type GlobalChatRows = Awaited<ReturnType<typeof loadGlobalChats>>;

const LIST_KEY = "all";

const byChannelCache = new TtlCache<GlobalChatRow>(60_000);
const byGuildCache = new TtlCache<GlobalChatRow>(60_000);
const listCache = new TtlCache<GlobalChatRows>(60_000);

export function invalidateGlobalChats(): void {
  byChannelCache.clear();
  byGuildCache.clear();
  listCache.clear();
}

export async function findGlobalChatByChannelId(channelId: string) {
  return byChannelCache.getOrLoad(channelId, () => loadGlobalChatByChannelId(channelId));
}

export async function findGlobalChatByGuildId(guildId: string) {
  return byGuildCache.getOrLoad(guildId, () => loadGlobalChatByGuildId(guildId));
}

export async function listGlobalChats() {
  return listCache.getOrLoad(LIST_KEY, () => loadGlobalChats());
}

export async function createGlobalChat(data: {
  channelId: string;
  guildId: string;
  webhookUrl: string;
}) {
  const created = await prisma.globalChat.create({ data });
  invalidateGlobalChats();
  return created;
}

export async function countGlobalChats() {
  return await prisma.globalChat.count();
}

export async function deleteGlobalChatByGuildId(guildId: string) {
  const deleted = await prisma.globalChat.delete({
    where: {
      guildId,
    },
  });
  invalidateGlobalChats();
  return deleted;
}

export async function createGlobalChatHistory(data: {
  userId: string;
  guildId: string;
  channelId: string;
  messageId: string;
}) {
  return await prisma.globalChatHistory.create({ data });
}

export async function createGlobalChatTransferHistory(data: {
  sourceId: number;
  guildId: string;
  channelId: string;
  messageId: string;
}) {
  return await prisma.globalChatTransferHistory.create({ data });
}

export async function listGlobalChatTransferHistoryBySourceId(sourceId: number) {
  return await prisma.globalChatTransferHistory.findMany({
    where: {
      sourceId,
    },
  });
}

export async function deleteGlobalChatTransferHistoryBySourceId(sourceId: number) {
  return await prisma.globalChatTransferHistory.deleteMany({
    where: {
      sourceId,
    },
  });
}
