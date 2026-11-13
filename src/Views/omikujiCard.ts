import type { OmikujiFortune } from "@/Views/omikujiFortunes";

/**
 * おみくじの札画像（@napi-rs/canvas、縦型 900×1600）。
 *
 * 構成は全フォーマット共通:
 * 帯ヘッダー（おみくじ ― フォーマット名）→ 第○番（漢数字）→
 * 大きな運勢 → 縦書きの和歌と総合 → 項目別運勢（2列×5行）→
 * フッターの TAKASUMIBOT 表記。フォーマット差はテーマ
 * （紙色・文字色・差し色・枠・透かし）だけが持ち、レイアウトと
 * 寸法は全種で同一。背景には TakasumiBOT アイコンを透かしで敷く。
 *
 * フォントはレベルカードと同じ流儀で、システムの日本語フォントを
 * 登録して使う（専用の明朝フォント資産はリポジトリに無いため、
 * 明朝系があれば優先し、無ければゴシック系に落ちる）。
 */

export interface OmikujiCardTheme {
  /** 紙の地色（frost の場合はグラデーションの開始色）。 */
  paper: string;
  /** frost 用グラデーションの終了色。通常は paper と同じ。 */
  paperEnd: string;
  /** 本文の文字色。 */
  ink: string;
  /** 枠・帯・見出しの差し色。 */
  accent: string;
  /** 帯の中の文字色。 */
  bandText: string;
  /** 透かしの色合い（アイコンを淡く敷く際の不透明度）。 */
  watermarkAlpha: number;
  /** 外枠の太さ。 */
  frameOuter: number;
  /** 内枠の太さ。 */
  frameInner: number;
  /** レベルカードと同系のフロストガラス表現にするか。 */
  frost?: boolean;
  /** 静止グラデーション縁（硝子用）。 */
  gradientFrame?: boolean;
}

export const OMIKUJI_THEMES: Record<string, OmikujiCardTheme> = {
  spring: {
    paper: "#fdf1f2", paperEnd: "#fdf1f2", ink: "#3a2b2e", accent: "#d96a85",
    bandText: "#ffffff", watermarkAlpha: 0.1, frameOuter: 6, frameInner: 2,
  },
  summer: {
    paper: "#eef7fd", paperEnd: "#eef7fd", ink: "#22303a", accent: "#2f8fc4",
    bandText: "#ffffff", watermarkAlpha: 0.1, frameOuter: 6, frameInner: 2,
  },
  autumn: {
    paper: "#fdf3e7", paperEnd: "#fdf3e7", ink: "#38281e", accent: "#c25e2e",
    bandText: "#ffffff", watermarkAlpha: 0.1, frameOuter: 6, frameInner: 2,
  },
  winter: {
    paper: "#f2f6fb", paperEnd: "#f2f6fb", ink: "#26313d", accent: "#46617e",
    bandText: "#ffffff", watermarkAlpha: 0.1, frameOuter: 6, frameInner: 2,
  },
  washi: {
    paper: "#f7f2e7", paperEnd: "#f7f2e7", ink: "#2b2722", accent: "#b0362a",
    bandText: "#ffffff", watermarkAlpha: 0.1, frameOuter: 6, frameInner: 2,
  },
  silk: {
    paper: "#232c4e", paperEnd: "#232c4e", ink: "#e8d9a8", accent: "#cfa94f",
    bandText: "#232c4e", watermarkAlpha: 0.14, frameOuter: 7, frameInner: 2,
  },
  ink: {
    paper: "#fcfcfa", paperEnd: "#fcfcfa", ink: "#262421", accent: "#262421",
    bandText: "#ffffff", watermarkAlpha: 0.07, frameOuter: 3, frameInner: 1,
  },
  glass: {
    paper: "#e0e7ff", paperEnd: "#bae6fd", ink: "#1f2a37", accent: "#0284c7",
    bandText: "#ffffff", watermarkAlpha: 0.13, frameOuter: 6, frameInner: 2,
    frost: true, gradientFrame: true,
  },
  morning: {
    paper: "#fffdf5", paperEnd: "#fffdf5", ink: "#33302a", accent: "#c9a227",
    bandText: "#ffffff", watermarkAlpha: 0.1, frameOuter: 6, frameInner: 2,
  },
  day: {
    paper: "#ffffff", paperEnd: "#ffffff", ink: "#24303c", accent: "#2563eb",
    bandText: "#ffffff", watermarkAlpha: 0.09, frameOuter: 6, frameInner: 2,
  },
  dusk: {
    paper: "#fde68a", paperEnd: "#fca5a5", ink: "#3d2626", accent: "#d1603d",
    bandText: "#ffffff", watermarkAlpha: 0.1, frameOuter: 6, frameInner: 2,
  },
  night: {
    paper: "#141c2e", paperEnd: "#141c2e", ink: "#d7dde8", accent: "#9db4d0",
    bandText: "#141c2e", watermarkAlpha: 0.14, frameOuter: 6, frameInner: 2,
  },
};

const W = 900;
const H = 1600;

const FONT = '"Geist", "OmikujiFont", "Noto Sans CJK JP", sans-serif';

let fontTried = false;

function registerFont(GlobalFonts: {
  registerFromPath: (path: string, name?: string) => unknown;
}): void {
  if (fontTried) return;
  fontTried = true;
  const latinCandidates = [
    process.env.OMIKUJI_CARD_FONT_LATIN,
    process.env.LEVEL_CARD_FONT_LATIN,
    "/srv/supabase-data/v4test/fonts/Geist-Bold.ttf",
  ];
  for (const path of latinCandidates) {
    if (!path) continue;
    try {
      if (GlobalFonts.registerFromPath(path, "Geist")) break;
    } catch {
    }
  }
  const jpCandidates = [
    process.env.OMIKUJI_CARD_FONT_JP,
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  ];
  for (const path of jpCandidates) {
    if (!path) continue;
    try {
      if (GlobalFonts.registerFromPath(path, "OmikujiFont")) break;
    } catch {
    }
  }
}

type Ctx = CanvasRenderingContext2D;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

const KANJI_DIGITS = "一二三四五六七八九";

/** 1〜100 を漢数字にする（十一・二十三・百）。札の「第○番」用。 */
export function kanjiNumber(number: number): string {
  if (number === 100) return "百";
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  let out = "";
  if (tens) out += (tens > 1 ? KANJI_DIGITS[tens - 1] : "") + "十";
  if (ones) out += KANJI_DIGITS[ones - 1];
  return out;
}

const PUNCT = new Set(["、", "。", "，", "．"]);
const SMALL_KANA = new Set([..."ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ"]);

/**
 * 縦書きで1列を描く（上から下）。句読点は右上に寄せ、
 * 小書き仮名は少し寄せる。空白は読み飛ばす。
 */
function drawVertical(
  ctx: Ctx,
  cx: number,
  yTop: number,
  text: string,
  pitch: number,
): void {
  const chars = [...text].filter((ch) => ch !== " " && ch !== "　");
  chars.forEach((ch, i) => {
    let x = cx;
    let y = yTop + i * pitch + pitch / 2;
    if (PUNCT.has(ch)) {
      x += pitch * 0.3;
      y -= pitch * 0.3;
    } else if (SMALL_KANA.has(ch)) {
      x += pitch * 0.14;
      y -= pitch * 0.14;
    }
    ctx.fillText(ch, x, y);
  });
}

/** 文字列を perColumn 文字ごとの列に割る（縦書きの総合用）。 */
function splitColumns(text: string, perColumn: number): string[] {
  const chars = [...text].filter((ch) => ch !== " " && ch !== "　");
  const columns: string[] = [];
  for (let i = 0; i < chars.length; i += perColumn) {
    columns.push(chars.slice(i, i + perColumn).join(""));
  }
  return columns;
}

export async function renderOmikujiCard(
  fortune: OmikujiFortune,
  botIconUrl?: string,
): Promise<Buffer | null> {
  try {
    const mod = await import("@napi-rs/canvas").catch(() => null);
    if (!mod) return null;
    const { createCanvas, loadImage, GlobalFonts } = mod;
    registerFont(GlobalFonts);

    const theme = OMIKUJI_THEMES[fortune.format] ?? OMIKUJI_THEMES.washi;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d") as unknown as Ctx;

    // 紙（夕と硝子は2色グラデーション、それ以外も同系で統一処理）
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, theme.paper);
    bg.addColorStop(1, theme.paperEnd);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 透かし（TakasumiBOT アイコン）。取得失敗時は無しで続行する。
    try {
      const icon = botIconUrl
        ? await Promise.race([
            loadImage(botIconUrl),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
          ])
        : null;
      if (icon) {
        ctx.save();
        ctx.globalAlpha = theme.watermarkAlpha;
        const size = 620;
        ctx.drawImage(icon as never, (W - size) / 2, 470, size, size);
        ctx.restore();
      }
    } catch {
    }

    // 硝子: フロストパネル
    if (theme.frost) {
      ctx.save();
      ctx.shadowColor = "rgba(100, 116, 139, 0.35)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      rr(ctx, 56, 56, W - 112, H - 112, 36);
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.fill();
      ctx.restore();
    }

    // 二重枠（硝子は静止グラデーション）
    const frameStroke = (inset: number, width: number) => {
      ctx.lineWidth = width;
      if (theme.gradientFrame) {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, "#38bdf8");
        g.addColorStop(0.5, "#818cf8");
        g.addColorStop(1, "#34d399");
        ctx.strokeStyle = g;
      } else {
        ctx.strokeStyle = theme.accent;
      }
      ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    };
    frameStroke(26, theme.frameOuter);
    frameStroke(46, theme.frameInner);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 帯ヘッダー
    ctx.fillStyle = theme.accent;
    ctx.fillRect(70, 72, W - 140, 84);
    ctx.fillStyle = theme.bandText;
    ctx.font = `bold 42px ${FONT}`;
    ctx.fillText(`おみくじ ― ${fortune.formatName}`, W / 2, 116);

    // 第○番
    ctx.fillStyle = theme.ink;
    ctx.font = `bold 52px ${FONT}`;
    ctx.fillText(`第${kanjiNumber(fortune.number)}番`, W / 2, 226);

    // 運勢（大）
    const rankSize = fortune.rank.length >= 3 ? 148 : 184;
    ctx.font = `bold ${rankSize}px ${FONT}`;
    ctx.fillText(fortune.rank, W / 2, 392);

    // 罫
    ctx.fillStyle = theme.accent;
    ctx.fillRect(150, 512, W - 300, 3);

    // 縦書きゾーン: 右から 和歌（上の句・下の句）→ 総合
    ctx.fillStyle = theme.ink;
    ctx.font = `31px ${FONT}`;
    const vTop = 548;
    const vPitch = 33;
    drawVertical(ctx, 786, vTop, fortune.waka[0], vPitch);
    drawVertical(ctx, 716, vTop, fortune.waka[1], vPitch);
    const summaryColumns = splitColumns(fortune.summary, 13);
    summaryColumns.forEach((column, i) => {
      drawVertical(ctx, 616 - i * 58, vTop, column, vPitch);
    });

    // 項目別（2列×5行）
    const itemTop = 1152;
    const rowPitch = 58;
    const colX = [84, 462];
    ctx.textAlign = "left";
    fortune.items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = colX[col];
      const y = itemTop + row * rowPitch;
      ctx.fillStyle = theme.accent;
      ctx.font = `bold 23px ${FONT}`;
      ctx.fillText(item.name, x, y);
      ctx.fillStyle = theme.ink;
      ctx.font = `21px ${FONT}`;
      ctx.fillText(item.text, x, y + 29);
    });

    // フッター
    ctx.textAlign = "center";
    ctx.fillStyle = theme.accent;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText("TAKASUMIBOT", W / 2, 1506);

    return canvas.toBuffer("image/png");
  } catch {
    return null;
  }
}
