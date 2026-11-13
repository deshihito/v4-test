import { prisma } from "@/Models/db";

export interface OmikujiResultData {
  userId: string;
  guildId: string;
  /** JST の日付 (YYYY-MM-DD)。 */
  date: string;
  format: string;
  number: number;
  rank: string;
  wakaIndex: number;
  summaryIndex: number;
  /** 項目別文面のインデックス（10項目分をカンマ区切りで保持）。 */
  itemIndices: string;
}

export async function findOmikujiResult(userId: string, guildId: string, date: string) {
  return await prisma.omikujiResult.findUnique({
    where: { userId_guildId_date: { userId, guildId, date } },
  });
}

/**
 * その日の結果を保存する。既に同日の行がある場合はそちらを返す
 * （同時実行で二重に作らないための upsert）。
 */
export async function saveOmikujiResult(data: OmikujiResultData) {
  return await prisma.omikujiResult.upsert({
    where: {
      userId_guildId_date: { userId: data.userId, guildId: data.guildId, date: data.date },
    },
    create: data,
    update: {},
  });
}
