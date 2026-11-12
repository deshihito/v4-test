import { Colors, Message, PermissionFlagsBits, ChannelType } from "discord.js";
import config from "@/config";
import { NotificationType } from "@/generated";
import { NotificationQueueService } from "@/Models/NotificationQueue";
import { buildBumpRtaEmbed, finishBumpRtaRound, resolveBumpActorId } from "@/Models/bumpRta";
import {
  findDcafeNotice,
  findDcafeNoticeIgnore,
  findDicoallNotice,
  findDicoallNoticeIgnore,
  findDiscomNotice,
  findDiscomNoticeIgnore,
  findDsioNotice,
  findDsioNoticeIgnore,
  findSharkbotNotice,
  findSharkbotNoticeIgnore,
  findVoteNotice,
  findVoteNoticeIgnore,
} from "@/Models/BoardNotice";

/**
 * DISBOARD / Dissoku 以外の掲示板サービスの bump/up 検出定義。
 * 成功サインとクールダウンは AGO BOT の boardNotify (core/game/rta) で
 * 実地観測された仕様を移植したもの。
 */
export interface BoardServiceDef {
  type: NotificationType;
  /** 送信者 Bot の ID (config.bot のキーではなく実 ID を保持する) */
  botId: string;
  /** 表示名 (RTA ラベルとそろえる) */
  label: string;
  /** 受信表示に使う動詞 */
  verb: "UP" | "BUMP" | "VOTE";
  /** 固定クールダウン (ミリ秒)。次回時刻が読めるサービスはそちら優先 */
  cooldownMs: number;
  /** 時刻指定時の通知タイトル/色/本文 (Cron 用) */
  notifyTitle: string;
  notifyColor: number;
  notifyDescription: string;
  findNotice: (guildId: string) => Promise<{ roleId: string } | null>;
  findNoticeIgnore: (guildId: string) => Promise<unknown>;
}

const HOUR = 3600000;

export const BOARD_SERVICES: BoardServiceDef[] = [
  {
    type: NotificationType.vote,
    botId: config.bot.sabachaId,
    label: "鯖ちゃんねる Vote",
    verb: "VOTE",
    cooldownMs: 2 * HOUR,
    notifyTitle: "鯖ちゃんねる Vote通知",
    notifyColor: Colors.Blue,
    notifyDescription: "VOTEの時間です\n/vote でサーバーに投票しよう！",
    findNotice: findVoteNotice,
    findNoticeIgnore: findVoteNoticeIgnore,
  },
  {
    type: NotificationType.dicoall,
    botId: config.bot.dicoallId,
    label: "Dicoall UP",
    verb: "UP",
    cooldownMs: 1 * HOUR,
    notifyTitle: "Dicoall UP通知",
    notifyColor: Colors.Purple,
    notifyDescription: "UPの時間です\n/up でサーバーの表示順位を上げよう！",
    findNotice: findDicoallNotice,
    findNoticeIgnore: findDicoallNoticeIgnore,
  },
  {
    type: NotificationType.dcafe,
    botId: config.bot.dcafeId,
    label: "Discord Cafe UP",
    verb: "UP",
    cooldownMs: 2 * HOUR,
    notifyTitle: "Discord Cafe UP通知",
    notifyColor: Colors.Orange,
    notifyDescription: "UPの時間です\n/up でサーバーの表示順位を上げよう！",
    findNotice: findDcafeNotice,
    findNoticeIgnore: findDcafeNoticeIgnore,
  },
  {
    type: NotificationType.sharkbot,
    botId: config.bot.sharkbotId,
    label: "SharkBot UP",
    verb: "UP",
    cooldownMs: 2 * HOUR,
    notifyTitle: "SharkBot UP通知",
    notifyColor: Colors.Aqua,
    notifyDescription: "UPの時間です\n/up でサーバーの表示順位を上げよう！",
    findNotice: findSharkbotNotice,
    findNoticeIgnore: findSharkbotNoticeIgnore,
  },
  {
    type: NotificationType.dsio,
    botId: config.bot.dsioId,
    label: "DiscordServers.io BUMP",
    verb: "BUMP",
    cooldownMs: 2 * HOUR,
    notifyTitle: "DiscordServers.io BUMP通知",
    notifyColor: Colors.White,
    notifyDescription: "BUMPの時間です\n/bump でサーバーの表示順位を上げよう！",
    findNotice: findDsioNotice,
    findNoticeIgnore: findDsioNoticeIgnore,
  },
  {
    type: NotificationType.discom,
    botId: config.bot.discomId,
    label: "DISCOM UP",
    verb: "UP",
    cooldownMs: 45 * 60000,
    notifyTitle: "DISCOM UP通知",
    notifyColor: Colors.Yellow,
    notifyDescription: "UPの時間です\n/up でサーバーの表示順位を上げよう！",
    findNotice: findDiscomNotice,
    findNoticeIgnore: findDiscomNoticeIgnore,
  },
];

export const BOARD_SERVICE_BY_TYPE: Partial<Record<NotificationType, BoardServiceDef>> =
  Object.fromEntries(BOARD_SERVICES.map((def) => [def.type, def]));

/** Embed 全文 + Components V2 のテキストを集める (署名照合用) */
export function collectMessageText(message: Message): string {
  const parts: string[] = [message.content ?? ""];
  for (const embed of message.embeds) {
    parts.push(embed.title ?? "", embed.description ?? "", embed.author?.name ?? "", embed.footer?.text ?? "");
    for (const field of embed.fields) parts.push(field.name, field.value);
  }
  // Components V2 の TextDisplay は embeds に入らないため、JSON 化して content を拾う
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === "object") {
      const record = node as Record<string, unknown>;
      if (typeof record.content === "string") parts.push(record.content);
      Object.values(record).forEach(walk);
    }
  };
  walk(message.components.map((component) => component.toJSON()));
  return parts.join("\n");
}

/** テキストから次回可能時刻を読む。読めなければ null (AGO _next_time_from_text の移植) */
export function nextTimeFromText(text: string, eventAt: Date): Date | null {
  let candidate: Date | null = null;
  const tsMatch = text.match(/<t:(\d+)/);
  if (tsMatch) {
    candidate = new Date(Number(tsMatch[1]) * 1000);
  } else {
    const dateMatch = text.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}[ T]\d{1,2}:\d{2}(?::\d{2})?/);
    if (dateMatch) {
      const raw = dateMatch[0].replace(/\//g, "-").replace("T", " ");
      const withSeconds = raw.split(":").length === 3 ? raw : `${raw}:00`;
      const parsed = new Date(`${withSeconds.replace(" ", "T")}+09:00`);
      if (!Number.isNaN(parsed.getTime())) candidate = parsed;
    }
  }
  if (candidate && eventAt < candidate && candidate.getTime() <= eventAt.getTime() + 24 * HOUR) {
    return candidate;
  }
  return null;
}

export interface BoardDetection {
  def: BoardServiceDef;
  delayMs: number;
}

/**
 * 掲示板サービスの成功メッセージを検出する。該当しなければ null。
 * 送信者 ID は author / applicationId / webhookId のいずれかで照合する。
 */
export function detectBoardService(message: Message): BoardDetection | null {
  const appIds = new Set(
    [message.author?.id, message.applicationId, message.webhookId].filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    ),
  );
  const def = BOARD_SERVICES.find((service) => appIds.has(service.botId));
  if (!def) return null;

  const text = collectMessageText(message);
  const folded = text.toLowerCase();
  const embeds = message.embeds;

  let matched = false;
  switch (def.type) {
    case NotificationType.vote:
      // 鯖ちゃんねる: footer または全文に 'voted'
      matched =
        embeds.some((embed) => (embed.footer?.text ?? "").includes("voted")) ||
        folded.includes("voted");
      break;
    case NotificationType.dicoall:
      matched =
        text.includes("サーバーがリストの最上段に更新されました") &&
        text.includes("サーバーリストのトップに正常に表示されています");
      break;
    case NotificationType.dcafe:
      matched = text.includes("Discord Cafe") && text.includes("サーバーの表示順位を上げました");
      break;
    case NotificationType.sharkbot:
      matched = text.includes("サーバーをUpしました") && text.includes("2時間後に再度Upできます");
      break;
    case NotificationType.dsio:
      matched =
        embeds.some((embed) => embed.title === "Server Bumped!") &&
        folded.includes("has been successfully bumped on");
      break;
    case NotificationType.discom:
      matched =
        embeds.some((embed) => embed.title === "Discomサーバー掲示板") &&
        text.includes("UPが成功しました");
      break;
    default:
      return null;
  }
  if (!matched) return null;

  // 次回時刻が応答に書かれているサービスはそちらを優先する
  const eventAt = message.editedAt ?? message.createdAt;
  let dueAt: Date | null = null;
  if (def.type === NotificationType.vote) {
    const firstField = embeds.find((embed) => embed.fields.length > 0)?.fields[0];
    if (firstField) dueAt = nextTimeFromText(`${firstField.name} ${firstField.value}`, eventAt);
  } else if (def.type === NotificationType.dicoall) {
    const field = embeds
      .flatMap((embed) => embed.fields)
      .find((candidate) => candidate.name.includes("次回の更新可能時間"));
    if (field) dueAt = nextTimeFromText(`${field.name} ${field.value}`, eventAt);
  }

  const delayMs = dueAt ? Math.max(0, dueAt.getTime() - Date.now()) : def.cooldownMs;
  return { def, delayMs };
}

/** 「約2時間後」「約45分後」のような遅延表示 */
export function formatDelay(delayMs: number): string {
  const minutes = Math.round(delayMs / 60000);
  if (minutes < 60) return `約${minutes}分後`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `約${hours}時間後` : `約${hours}時間${rest}分後`;
}

/**
 * 検出メッセージへの共通処理 (Bump.ts と同じ流れ):
 * 権限確認 → 無効化設定 → 通知キュー追加 (重複時は無音) → 受信表示 → RTA 完了記録
 */
export async function handleBoardServiceMessage(message: Message): Promise<void> {
  if (
    !message.inGuild() ||
    message.channel.type !== ChannelType.GuildText ||
    !message.guild.members.me ||
    !message.guild.members.me
      .permissionsIn(message.channel)
      .has(PermissionFlagsBits.ViewChannel) ||
    !message.guild.members.me.permissionsIn(message.channel).has(PermissionFlagsBits.SendMessages)
  )
    return;

  const detection = detectBoardService(message);
  if (!detection) return;
  const { def, delayMs } = detection;

  const ignore = await def.findNoticeIgnore(message.guild.id);
  if (ignore) return;

  const created = await NotificationQueueService.add({
    guildId: message.guild.id,
    channelId: message.channel.id,
    type: def.type,
    delay: delayMs,
  });

  if (created) {
    await message.channel
      .send({
        embeds: [
          {
            color: Colors.White,
            title: `${def.label}通知`,
            description: `${def.verb}を受信しました\n${formatDelay(delayMs)}に通知します`,
          },
        ],
      })
      .catch(() => {});
  }

  const actorId = resolveBumpActorId(message);
  if (actorId) {
    const result = await finishBumpRtaRound(message.guild.id, def.type, actorId);
    if (result) {
      await message.channel
        .send({ embeds: [buildBumpRtaEmbed(def.type, actorId, result)] })
        .catch(() => {});
    }
  }
}
