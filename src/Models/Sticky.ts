import { Client } from "discord.js";
import { prisma } from "@/Models/db";

export interface StickySettings {
  enabled: boolean;
  channelId: string | null;
  messageId: string | null;
  content: string;
}

export async function findStickySetting(guildId: string): Promise<StickySettings> {
  const row = await prisma.stickySetting.findUnique({ where: { guildId } });
  return {
    enabled: row?.enabled ?? false,
    channelId: row?.channelId ?? null,
    messageId: row?.messageId ?? null,
    content: row?.content ?? "",
  };
}

export async function setStickyChannel(guildId: string, channelId: string): Promise<void> {
  await prisma.stickySetting.upsert({
    where: { guildId },
    create: { guildId, channelId, messageId: null },
    update: { channelId, messageId: null },
  });
}

export async function setStickyContent(guildId: string, content: string): Promise<void> {
  await prisma.stickySetting.upsert({
    where: { guildId },
    create: { guildId, content, enabled: true },
    update: { content, enabled: true },
  });
}

export async function setStickyEnabled(guildId: string, enabled: boolean): Promise<void> {
  await prisma.stickySetting.upsert({
    where: { guildId },
    create: { guildId, enabled },
    update: { enabled },
  });
}

export async function setStickyMessageId(guildId: string, messageId: string): Promise<void> {
  await prisma.stickySetting.update({
    where: { guildId },
    data: { messageId },
  });
}

const stickyLocks = new Map<string, Promise<void>>();

export async function resendStickyPanel(client: Client, guildId: string): Promise<void> {
  const previous = stickyLocks.get(guildId) ?? Promise.resolve();
  const run = previous.then(() => resendStickyPanelLocked(client, guildId)).catch(() => {});
  stickyLocks.set(guildId, run);
  await run;
}

async function resendStickyPanelLocked(client: Client, guildId: string): Promise<void> {
  const settings = await findStickySetting(guildId);
  if (!settings.enabled || !settings.channelId || !settings.content) return;

  const channel = await client.channels.fetch(settings.channelId).catch(() => null);
  if (!channel || !channel.isSendable()) return;
  if ((channel as { guildId?: string | null }).guildId !== guildId) return;

  if (settings.messageId) {
    const old = await channel.messages.fetch(settings.messageId).catch(() => null);
    if (old) await old.delete().catch(() => {});
  }

  const panel = await channel.send({ content: settings.content }).catch(() => null);
  if (panel) await setStickyMessageId(guildId, panel.id);
}
