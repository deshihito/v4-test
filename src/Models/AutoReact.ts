import { prisma } from "@/Models/db";

export function parseEmojis(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export async function listAutoReactChannels(
  guildId: string,
): Promise<{ channelId: string; emojis: string[] }[]> {
  const rows = await prisma.autoReactChannel.findMany({
    where: { guildId },
    orderBy: { id: "asc" },
  });
  return rows.map((row) => ({ channelId: row.channelId, emojis: parseEmojis(row.emojis) }));
}

export async function findAutoReactEmojis(
  guildId: string,
  channelId: string,
): Promise<string[]> {
  const row = await prisma.autoReactChannel.findUnique({
    where: { guildId_channelId: { guildId, channelId } },
  });
  return row ? parseEmojis(row.emojis) : [];
}

export async function setAutoReactEmojis(
  guildId: string,
  channelId: string,
  emojis: string[],
): Promise<void> {
  if (emojis.length === 0) {
    await prisma.autoReactChannel.deleteMany({ where: { guildId, channelId } });
    return;
  }
  const json = JSON.stringify(emojis);
  await prisma.autoReactChannel.upsert({
    where: { guildId_channelId: { guildId, channelId } },
    create: { guildId, channelId, emojis: json },
    update: { emojis: json },
  });
}
