import { prisma } from "@/Models/db";

export async function findGlobalChatByChannelId(channelId: string) {
  return await prisma.globalChat.findFirst({
    where: {
      channelId,
    },
  });
}

export async function findGlobalChatByGuildId(guildId: string) {
  return await prisma.globalChat.findUnique({
    where: {
      guildId,
    },
  });
}

export async function listGlobalChats() {
  return await prisma.globalChat.findMany();
}

export async function createGlobalChat(data: {
  channelId: string;
  guildId: string;
  webhookUrl: string;
}) {
  return await prisma.globalChat.create({ data });
}

export async function countGlobalChats() {
  return await prisma.globalChat.count();
}

export async function deleteGlobalChatByGuildId(guildId: string) {
  return await prisma.globalChat.delete({
    where: {
      guildId,
    },
  });
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
