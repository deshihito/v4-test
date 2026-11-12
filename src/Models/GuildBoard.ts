import { prisma } from "@/Models/db";

/** サーバー掲示板の登録情報を取得する */
export async function findGuildBoard(guildId: string) {
  return await prisma.guildBoard.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** サーバー掲示板の招待URLを更新する */
export async function updateGuildBoardInviteUrl(guildId: string, inviteUrl: string) {
  return await prisma.guildBoard.update({
    where: {
      guildId: guildId,
    },
    data: {
      inviteUrl: inviteUrl,
    },
  });
}

/** サーバー掲示板の更新日時を更新する */
export async function updateGuildBoardUpdatedAt(guildId: string, updatedAt: Date) {
  return await prisma.guildBoard.update({
    where: {
      guildId: guildId,
    },
    data: {
      updatedAt: updatedAt,
    },
  });
}

/** サーバー掲示板の登録情報を削除する */
export async function deleteGuildBoard(guildId: string) {
  return await prisma.guildBoard.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** サーバー掲示板の登録情報を作成する */
export async function createGuildBoard(guildId: string, description: string, inviteUrl: string) {
  return await prisma.guildBoard.create({
    data: {
      guildId: guildId,
      description: description,
      inviteUrl: inviteUrl,
    },
  });
}
