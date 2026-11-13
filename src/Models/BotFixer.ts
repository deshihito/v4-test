import { prisma } from "@/Models/db";

export const COMMAND_CONTROL_MODES = ["off", "deny", "allow"] as const;
export type CommandControlMode = (typeof COMMAND_CONTROL_MODES)[number];

export const COMMAND_CONTROL_MODE_LABELS: Record<CommandControlMode, string> = {
  off: "制限なし",
  deny: "禁止リスト",
  allow: "許可リストのみ",
};

export const SELF_COMMAND = "bot_fixer";
export const RESTRICTED_MESSAGE = "このサーバーでは管理者がこの機能の利用を制限しています。";
export const RATE_MAX_COUNT = 1000;
export const RATE_MAX_WINDOW_SECONDS = 7 * 24 * 60 * 60;

export interface RateRule {
  count: number;
  windowSeconds: number;
}

export interface CommandControlData {
  mode: CommandControlMode;
  actions: string[];
  rates: Record<string, RateRule>;
}

export class RateCounter {
  private hits = new Map<string, number[]>();

  public checkAndRecord(
    key: string,
    count: number,
    windowSeconds: number,
    now: number = Date.now() / 1000,
  ): number | null {
    const windowStart = now - windowSeconds;
    const list = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    if (list.length >= count) {
      this.hits.set(key, list);
      return Math.max(0, windowSeconds - (now - list[0]));
    }
    list.push(now);
    this.hits.set(key, list);
    return null;
  }
}

const commandCounter = new RateCounter();
const botCounter = new RateCounter();

export async function getCommandControl(guildId: string): Promise<CommandControlData> {
  const [setting, actionRows, rateRows] = await Promise.all([
    prisma.commandControlSetting.findUnique({ where: { guildId } }),
    prisma.commandControlAction.findMany({ where: { guildId }, orderBy: { id: "asc" } }),
    prisma.commandControlRate.findMany({ where: { guildId } }),
  ]);
  const mode = COMMAND_CONTROL_MODES.includes(setting?.mode as CommandControlMode)
    ? (setting!.mode as CommandControlMode)
    : "off";
  const rates: Record<string, RateRule> = {};
  for (const row of rateRows) {
    rates[row.command] = { count: row.count, windowSeconds: row.windowSeconds };
  }
  return {
    mode,
    actions: actionRows.map((row) => row.command).filter((name) => name !== SELF_COMMAND),
    rates,
  };
}

export async function setCommandControlMode(
  guildId: string,
  mode: CommandControlMode,
): Promise<void> {
  await prisma.commandControlSetting.upsert({
    where: { guildId },
    create: { guildId, mode },
    update: { mode },
  });
}

export async function toggleCommandControlAction(
  guildId: string,
  command: string,
): Promise<boolean> {
  const existing = await prisma.commandControlAction.findUnique({
    where: { guildId_command: { guildId, command } },
  });
  if (existing) {
    await prisma.commandControlAction.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.commandControlAction.create({ data: { guildId, command } });
  return true;
}

export async function setCommandControlRate(
  guildId: string,
  command: string,
  rule: RateRule | null,
): Promise<void> {
  if (!rule) {
    await prisma.commandControlRate.deleteMany({ where: { guildId, command } });
    return;
  }
  await prisma.commandControlRate.upsert({
    where: { guildId_command: { guildId, command } },
    create: { guildId, command, count: rule.count, windowSeconds: rule.windowSeconds },
    update: { count: rule.count, windowSeconds: rule.windowSeconds },
  });
}

export function modeBlocks(data: CommandControlData, command: string): boolean {
  if (command === SELF_COMMAND) return false;
  const listed = data.actions.includes(command);
  if (data.mode === "deny") return listed;
  if (data.mode === "allow") return !listed;
  return false;
}

export type CommandVerdict =
  | { allowed: true }
  | { allowed: false; reason: "restricted" | "rate"; retryAfter?: number };

export function checkCommandControl(
  data: CommandControlData,
  command: string,
  guildId: string,
  userId: string,
): CommandVerdict {
  if (command === SELF_COMMAND) return { allowed: true };
  if (modeBlocks(data, command)) return { allowed: false, reason: "restricted" };
  const rule = data.rates[command];
  if (rule) {
    const retry = commandCounter.checkAndRecord(
      `${guildId}:${userId}:${command}`,
      rule.count,
      rule.windowSeconds,
    );
    if (retry !== null) return { allowed: false, reason: "rate", retryAfter: retry };
  }
  return { allowed: true };
}

export function formatRetryAfter(seconds: number): string {
  const total = Math.max(1, Math.ceil(seconds));
  if (total >= 60) return `約${Math.ceil(total / 60)}分`;
  return `約${total}秒`;
}

export interface BotControlEntry {
  botId: string;
  channelIds: string[];
  rate: RateRule | null;
}

export async function getBotControl(guildId: string): Promise<BotControlEntry[]> {
  const [settings, channels] = await Promise.all([
    prisma.botControlSetting.findMany({ where: { guildId }, orderBy: { id: "asc" } }),
    prisma.botControlChannel.findMany({ where: { guildId }, orderBy: { id: "asc" } }),
  ]);
  const byBot = new Map<string, string[]>();
  for (const row of channels) {
    const list = byBot.get(row.botId) ?? [];
    list.push(row.channelId);
    byBot.set(row.botId, list);
  }
  const entries: BotControlEntry[] = [];
  for (const row of settings) {
    const channelIds = byBot.get(row.botId) ?? [];
    if (channelIds.length === 0) continue;
    entries.push({
      botId: row.botId,
      channelIds,
      rate:
        row.rateCount !== null && row.rateWindowSeconds !== null
          ? { count: row.rateCount, windowSeconds: row.rateWindowSeconds }
          : null,
    });
  }
  return entries;
}

export async function setBotControlChannels(
  guildId: string,
  botId: string,
  channelIds: string[],
): Promise<void> {
  await prisma.botControlSetting.upsert({
    where: { guildId_botId: { guildId, botId } },
    create: { guildId, botId },
    update: {},
  });
  await prisma.botControlChannel.deleteMany({ where: { guildId, botId } });
  await prisma.botControlChannel.createMany({
    data: channelIds.map((channelId) => ({ guildId, botId, channelId })),
  });
}

export async function setBotControlRate(
  guildId: string,
  botId: string,
  rule: RateRule | null,
): Promise<void> {
  await prisma.botControlSetting.update({
    where: { guildId_botId: { guildId, botId } },
    data: {
      rateCount: rule?.count ?? null,
      rateWindowSeconds: rule?.windowSeconds ?? null,
    },
  });
}

export async function removeBotControl(guildId: string, botId: string): Promise<void> {
  await prisma.botControlChannel.deleteMany({ where: { guildId, botId } });
  await prisma.botControlSetting.deleteMany({ where: { guildId, botId } });
}

export function planBotControl(
  entry: BotControlEntry,
  guildId: string,
  channelId: string,
): "channel" | "rate" | null {
  if (!entry.channelIds.includes(channelId)) return "channel";
  if (entry.rate) {
    const retry = botCounter.checkAndRecord(
      `${guildId}:${entry.botId}:bot_control`,
      entry.rate.count,
      entry.rate.windowSeconds,
    );
    if (retry !== null) return "rate";
  }
  return null;
}
