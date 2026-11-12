import { APIEmbed, Colors, Message } from "discord.js";
import { prisma } from "@/Models/db";
import { NotificationType } from "@/generated";

export interface BumpRtaResult {
  elapsedMs: number;
  /** このユーザーのサーバー内順位 (ベスト記録同士で比較) */
  serverRank: number;
  /** このユーザーの全体順位 (ベスト記録同士で比較) */
  globalRank: number;
}

export const BUMP_RTA_TYPE_LABEL: Record<NotificationType, string> = {
  [NotificationType.bump]: "BUMP",
  [NotificationType.dissoku]: "Dissoku UP",
  [NotificationType.tksmup]: "TakasumiBOT UP",
};

/** ミリ秒を「12.3秒」「1分05秒」の形にする */
export function formatElapsed(ms: number): string {
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}秒`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}分${String(seconds).padStart(2, "0")}秒`;
}

/**
 * bump/up 完了メッセージから実行したユーザーを特定する。
 * スラッシュコマンドへの応答なら interactionMetadata が確実。
 * 無ければ本文と Embed 内のメンションを探す。
 */
export function resolveBumpActorId(message: Message): string | null {
  const fromInteraction = message.interactionMetadata?.user?.id;
  if (fromInteraction) return fromInteraction;

  const texts = [
    message.content,
    ...message.embeds.flatMap((e) => [
      e.description ?? "",
      e.author?.name ?? "",
      ...e.fields.flatMap((f) => [f.name, f.value]),
    ]),
  ];
  for (const text of texts) {
    const match = text.match(/<@!?(\d{17,20})>/);
    if (match) return match[1];
  }
  return null;
}

/** 通知が送られたタイミングで RTA のラウンドを開始する */
export async function startBumpRtaRound(
  guildId: string,
  type: NotificationType,
  channelId: string,
): Promise<void> {
  await prisma.bumpRtaRound
    .upsert({
      where: { guildId_type: { guildId, type } },
      create: { guildId, type, channelId, notifiedAt: new Date() },
      update: { channelId, notifiedAt: new Date() },
    })
    .catch(() => {});
}

/**
 * bump/up の完了でラウンドを締め、記録と順位を返す。
 * ラウンドが無い (通知を挟んでいない) 場合は何も記録せず null を返す。
 * ラウンドは最初に完了した1件だけが記録され、消費される。
 */
export async function finishBumpRtaRound(
  guildId: string,
  type: NotificationType,
  userId: string,
): Promise<BumpRtaResult | null> {
  const round = await prisma.bumpRtaRound.findUnique({
    where: { guildId_type: { guildId, type } },
  });
  if (!round) return null;

  // 先にラウンドを消すことで、同じラウンドの二重記録を防ぐ
  await prisma.bumpRtaRound.deleteMany({ where: { guildId, type } });

  const elapsedMs = Date.now() - round.notifiedAt.getTime();
  if (elapsedMs < 0) return null;

  await prisma.bumpRtaRecord.create({
    data: { guildId, userId, type, elapsedMs },
  });

  const [myServerBest, myGlobalBest, serverBests, globalBests] = await Promise.all([
    prisma.bumpRtaRecord.aggregate({
      where: { guildId, type, userId },
      _min: { elapsedMs: true },
    }),
    prisma.bumpRtaRecord.aggregate({
      where: { type, userId },
      _min: { elapsedMs: true },
    }),
    prisma.bumpRtaRecord.groupBy({
      by: ["userId"],
      where: { guildId, type },
      _min: { elapsedMs: true },
    }),
    prisma.bumpRtaRecord.groupBy({
      by: ["userId"],
      where: { type },
      _min: { elapsedMs: true },
    }),
  ]);

  const countBetter = (
    bests: { _min: { elapsedMs: number | null } }[],
    mine: number | null,
  ): number =>
    mine === null
      ? 0
      : bests.filter((b) => b._min.elapsedMs !== null && b._min.elapsedMs < mine).length;

  return {
    elapsedMs,
    serverRank: countBetter(serverBests, myServerBest._min.elapsedMs) + 1,
    globalRank: countBetter(globalBests, myGlobalBest._min.elapsedMs) + 1,
  };
}

/** RTA 記録のアナウンス用 Embed */
export function buildBumpRtaEmbed(
  type: NotificationType,
  userId: string,
  result: BumpRtaResult,
): APIEmbed {
  const label = BUMP_RTA_TYPE_LABEL[type];
  return {
    color: Colors.Yellow,
    title: `${label} RTA記録`,
    description:
      `<@${userId}> が通知から **${formatElapsed(result.elapsedMs)}** で${label}しました\n` +
      `サーバー内 ${result.serverRank}位 / 全体 ${result.globalRank}位`,
  };
}
