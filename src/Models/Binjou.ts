import { prisma } from "@/Models/db";

export interface BinjouSettings {
  thinking: boolean;
  thumbsup: boolean;
}

export interface BinjouRule {
  source: string;
  sourceKey: string;
  target: string;
}

export const MAX_BINJOU_RULES = 20;

export function normalizeEmojiInput(value: string): { key: string; display: string } {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return { key: `id:${trimmed}`, display: `<:emoji:${trimmed}>` };
  }
  const custom = trimmed.match(/^<(a?):[A-Za-z0-9_]+:(\d+)>$/);
  if (custom) {
    return { key: `id:${custom[2]}`, display: trimmed };
  }
  if (!trimmed || trimmed.length > 32) {
    throw new Error("絵文字またはカスタム絵文字IDを入力してください。");
  }
  return { key: trimmed.replace(/\uFE0F/g, ""), display: trimmed };
}

export function emojiKey(value: string): string {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return `id:${trimmed}`;
  const custom = trimmed.match(/^<(a?):[A-Za-z0-9_]+:(\d+)>$/);
  if (custom) return `id:${custom[2]}`;
  return trimmed.replace(/\uFE0F/g, "");
}

export async function findBinjouSetting(guildId: string): Promise<BinjouSettings> {
  const row = await prisma.binjouSetting.findUnique({ where: { guildId } });
  return {
    thinking: row?.thinking ?? true,
    thumbsup: row?.thumbsup ?? true,
  };
}

export async function setBinjouEnabled(
  guildId: string,
  key: "thinking" | "thumbsup",
  enabled: boolean,
): Promise<void> {
  await prisma.binjouSetting.upsert({
    where: { guildId },
    create: { guildId, [key]: enabled },
    update: { [key]: enabled },
  });
}

export async function listBinjouRules(guildId: string): Promise<BinjouRule[]> {
  const rows = await prisma.binjouRule.findMany({
    where: { guildId },
    orderBy: { id: "asc" },
  });
  return rows.map((row) => ({
    source: row.source,
    sourceKey: row.sourceKey,
    target: row.target,
  }));
}

export async function upsertBinjouRule(
  guildId: string,
  source: { key: string; display: string },
  target: { key: string; display: string },
): Promise<void> {
  const existing = await prisma.binjouRule.findUnique({
    where: { guildId_sourceKey: { guildId, sourceKey: source.key } },
  });
  if (!existing) {
    const count = await prisma.binjouRule.count({ where: { guildId } });
    if (count >= MAX_BINJOU_RULES) {
      throw new Error("カスタム便乗は20件まで登録できます。");
    }
  }
  await prisma.binjouRule.upsert({
    where: { guildId_sourceKey: { guildId, sourceKey: source.key } },
    create: { guildId, source: source.display, sourceKey: source.key, target: target.display },
    update: { source: source.display, target: target.display },
  });
}

export async function deleteBinjouRule(guildId: string, sourceKey: string): Promise<void> {
  await prisma.binjouRule.deleteMany({ where: { guildId, sourceKey } });
}
