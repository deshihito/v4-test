import { prisma } from "@/Models/db";

export async function findHiroyukiByChannelId(channelId: string) {
  return await prisma.hiroyuki.findFirst({
    where: {
      channelId,
    },
  });
}

export async function findHiroyukiByGuildId(guildId: string) {
  return await prisma.hiroyuki.findFirst({
    where: {
      guildId,
    },
  });
}

export async function createHiroyuki(data: {
  channelId: string;
  guildId: string;
  webhookUrl: string;
}) {
  return await prisma.hiroyuki.create({ data });
}

export async function deleteHiroyukiByGuildId(guildId: string) {
  return await prisma.hiroyuki.delete({
    where: {
      guildId,
    },
  });
}

export async function deleteManyHiroyukiByGuildId(guildId: string) {
  return await prisma.hiroyuki.deleteMany({
    where: {
      guildId,
    },
  });
}
