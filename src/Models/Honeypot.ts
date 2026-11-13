import { Client, MessageFlags } from "discord.js";
import { prisma } from "@/Models/db";
import TtlCache from "@/util/ttlCache";
import { buildHoneypotWarning } from "@/Views/honeypotPanel";

export interface HoneypotSettings {
  enabled: boolean;
  channelId: string | null;
  messageId: string | null;
}

const settingCache = new TtlCache<HoneypotSettings>(60_000);

export function invalidateHoneypot(guildId: string): void {
  settingCache.delete(guildId);
}

export async function findHoneypotSetting(guildId: string): Promise<HoneypotSettings> {
  return settingCache.getOrLoad(guildId, async () => {
    const row = await prisma.honeypotSetting.findUnique({ where: { guildId } });
    return {
      enabled: row?.enabled ?? false,
      channelId: row?.channelId ?? null,
      messageId: row?.messageId ?? null,
    };
  });
}

export async function setHoneypotChannel(guildId: string, channelId: string): Promise<void> {
  await prisma.honeypotSetting.upsert({
    where: { guildId },
    create: { guildId, channelId, messageId: null, enabled: true },
    update: { channelId, messageId: null, enabled: true },
  });
  invalidateHoneypot(guildId);
}

export async function setHoneypotMessageId(guildId: string, messageId: string): Promise<void> {
  await prisma.honeypotSetting.update({
    where: { guildId },
    data: { messageId },
  });
  const cached = settingCache.get(guildId);
  if (cached) settingCache.set(guildId, { ...cached, messageId });
}

export async function sendHoneypotWarning(client: Client, guildId: string): Promise<void> {
  const settings = await findHoneypotSetting(guildId);
  if (!settings.enabled || !settings.channelId) return;

  const channel = await client.channels.fetch(settings.channelId).catch(() => null);
  if (!channel || !channel.isSendable()) return;
  if ((channel as { guildId?: string | null }).guildId !== guildId) return;

  if (settings.messageId) {
    const old = await channel.messages.fetch(settings.messageId).catch(() => null);
    if (old) await old.delete().catch(() => {});
  }

  const panel = await channel
    .send({ components: [buildHoneypotWarning()], flags: MessageFlags.IsComponentsV2 })
    .catch(() => null);
  if (panel) await setHoneypotMessageId(guildId, panel.id);
}
