

export interface LevelCardData {
  name: string;
  level: number;

  current: number;

  next: number;
  total: number;
  serverRank: number;
  globalRank: number;
  avatarUrl: string;
}

const W = 1000;
const H = 360;

const FONT = '"Geist", "LevelCardFont", "Noto Sans CJK JP", sans-serif';

let fontTried = false;

function registerFont(GlobalFonts: {
  registerFromPath: (path: string, name?: string) => boolean;
}): void {
  if (fontTried) return;
  fontTried = true;
  const latinCandidates = [
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
    process.env.LEVEL_CARD_FONT_JP,
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  ];
  for (const path of jpCandidates) {
    if (!path) continue;
    try {
      if (GlobalFonts.registerFromPath(path, "LevelCardFont")) break;
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

function orb(
  ctx: Ctx,
  cx: number,
  cy: number,
  radius: number,
  rgb: string,
  alpha: number,
): void {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}

function fitText(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const chars = [...text];
  while (chars.length > 0) {
    chars.pop();
    const t = `${chars.join("")}…`;
    if (ctx.measureText(t).width <= maxWidth) return t;
  }
  return "…";
}

export async function renderLevelCard(data: LevelCardData): Promise<Buffer | null> {
  try {

    const mod = await import("@napi-rs/canvas").catch(() => null);
    if (!mod) return null;
    const { createCanvas, loadImage, GlobalFonts } = mod;
    registerFont(GlobalFonts);

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d") as unknown as Ctx;

    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "rgb(224, 231, 255)");
    bgGrad.addColorStop(1, "rgb(186, 230, 253)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    orb(ctx, 910, 90, 320, "167, 243, 208", 0.63);
    orb(ctx, 70, 350, 260, "253, 224, 171", 0.55);
    orb(ctx, 590, 370, 260, "199, 210, 254", 0.47);

    ctx.save();
    ctx.shadowColor = "rgba(100, 116, 139, 0.35)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    rr(ctx, 28, 30, W - 56, H - 60, 36);
    ctx.fillStyle = "rgba(255, 255, 255, 0.59)";
    ctx.fill();
    ctx.restore();
    rr(ctx, 28, 30, W - 56, H - 60, 36);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(174, 180, 110, 0, Math.PI * 2);
    ctx.clip();
    let avatarDrawn = false;
    if (data.avatarUrl) {
      try {
        const img = await loadImage(data.avatarUrl);
        ctx.drawImage(img as never, 64, 70, 220, 220);
        avatarDrawn = true;
      } catch {
        avatarDrawn = false;
      }
    }
    if (!avatarDrawn) {
      ctx.fillStyle = "rgb(148, 163, 184)";
      ctx.fillRect(64, 70, 220, 220);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(174, 180, 110, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 4;
    ctx.stroke();

    const ink = "rgb(30, 41, 59)";
    const sub = "rgb(100, 116, 139)";
    const accent = "rgb(16, 185, 129)";
    ctx.textBaseline = "top";

    ctx.fillStyle = ink;
    ctx.font = `bold 42px ${FONT}`;
    ctx.fillText(fitText(ctx, data.name, 606), 330, 58);
    ctx.font = `bold 58px ${FONT}`;
    ctx.fillText(`Lv.${data.level}`, 330, 116);

    rr(ctx, 330, 206, 606, 36, 18);
    ctx.fillStyle = "rgba(226, 232, 240, 0.86)";
    ctx.fill();
    const ratio = Math.min(1, Math.max(0, data.current / Math.max(1, data.next)));
    if (ratio > 0) {
      rr(ctx, 330, 206, Math.max(606 * ratio, 36), 36, 18);
      ctx.fillStyle = accent;
      ctx.fill();
    }

    ctx.fillStyle = sub;
    ctx.font = `bold 27px ${FONT}`;
    ctx.fillText(`${data.current} / ${data.next} EXP`, 330, 254);
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillText(
      `総EXP ${data.total}    サーバー内 ${data.serverRank}位    全体 ${data.globalRank}位`,
      330,
      294,
    );

    return canvas.toBuffer("image/png");
  } catch {
    return null;
  }
}
