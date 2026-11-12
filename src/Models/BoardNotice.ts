import { prisma } from "@/Models/db";

/** 参加メッセージ設定を取得する */
export async function findJoinNotice(guildId: string) {
  return await prisma.joinNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** 参加メッセージ設定を作成する */
export async function createJoinNotice(
  guildId: string,
  channelId: string,
  webhookUrl: string,
  message: string,
) {
  return await prisma.joinNotice.create({
    data: {
      guildId: guildId,
      channelId: channelId,
      webhookUrl: webhookUrl,
      message: message,
    },
  });
}

/** 参加メッセージ設定のメッセージを更新する */
export async function updateJoinNoticeMessage(guildId: string, message: string) {
  return await prisma.joinNotice.update({
    where: {
      guildId: guildId,
    },
    data: {
      message: message,
    },
  });
}

/** 参加メッセージ設定を削除する */
export async function deleteJoinNotice(guildId: string) {
  return await prisma.joinNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** 退出メッセージ設定を取得する */
export async function findLeaveNotice(guildId: string) {
  return await prisma.leaveNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** 退出メッセージ設定を作成する */
export async function createLeaveNotice(
  guildId: string,
  channelId: string,
  webhookUrl: string,
  message: string,
) {
  return await prisma.leaveNotice.create({
    data: {
      guildId: guildId,
      channelId: channelId,
      webhookUrl: webhookUrl,
      message: message,
    },
  });
}

/** 退出メッセージ設定を削除する */
export async function deleteLeaveNotice(guildId: string) {
  return await prisma.leaveNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** BUMP通知設定を取得する */
export async function findBumpNotice(guildId: string) {
  return await prisma.bumpNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** BUMP通知設定を作成する */
export async function createBumpNotice(guildId: string, roleId: string) {
  return await prisma.bumpNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** BUMP通知設定を作成または更新する */
export async function upsertBumpNotice(guildId: string, roleId: string) {
  return await prisma.bumpNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** BUMP通知設定を削除する */
export async function deleteBumpNotice(guildId: string) {
  return await prisma.bumpNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** Dissoku UP通知設定を取得する */
export async function findDissokuNotice(guildId: string) {
  return await prisma.dissokuNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** Dissoku UP通知設定を作成する */
export async function createDissokuNotice(guildId: string, roleId: string) {
  return await prisma.dissokuNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** Dissoku UP通知設定を作成または更新する */
export async function upsertDissokuNotice(guildId: string, roleId: string) {
  return await prisma.dissokuNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** Dissoku UP通知設定を削除する */
export async function deleteDissokuNotice(guildId: string) {
  return await prisma.dissokuNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** UP通知設定を取得する */
export async function findUpNotice(guildId: string) {
  return await prisma.upNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** UP通知設定を作成する */
export async function createUpNotice(guildId: string, roleId: string) {
  return await prisma.upNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** UP通知設定を作成または更新する */
export async function upsertUpNotice(guildId: string, roleId: string) {
  return await prisma.upNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** UP通知設定を削除する */
export async function deleteUpNotice(guildId: string) {
  return await prisma.upNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** BUMP通知の無効化設定を取得する */
export async function findBumpNoticeIgnore(guildId: string) {
  return await prisma.bumpNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** BUMP通知の無効化設定を作成する */
export async function createBumpNoticeIgnore(guildId: string) {
  return await prisma.bumpNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** BUMP通知の無効化設定を削除する */
export async function deleteBumpNoticeIgnore(guildId: string) {
  return await prisma.bumpNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** Dissoku UP通知の無効化設定を取得する */
export async function findDissokuNoticeIgnore(guildId: string) {
  return await prisma.dissokuNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** Dissoku UP通知の無効化設定を作成する */
export async function createDissokuNoticeIgnore(guildId: string) {
  return await prisma.dissokuNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** Dissoku UP通知の無効化設定を削除する */
export async function deleteDissokuNoticeIgnore(guildId: string) {
  return await prisma.dissokuNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** UP通知の無効化設定を取得する */
export async function findUpNoticeIgnore(guildId: string) {
  return await prisma.upNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** UP通知の無効化設定を作成する */
export async function createUpNoticeIgnore(guildId: string) {
  return await prisma.upNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** UP通知の無効化設定を削除する */
export async function deleteUpNoticeIgnore(guildId: string) {
  return await prisma.upNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** 鯖ちゃんねる Vote通知設定を取得する */
export async function findVoteNotice(guildId: string) {
  return await prisma.voteNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** 鯖ちゃんねる Vote通知設定を作成する */
export async function createVoteNotice(guildId: string, roleId: string) {
  return await prisma.voteNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** 鯖ちゃんねる Vote通知設定を作成または更新する */
export async function upsertVoteNotice(guildId: string, roleId: string) {
  return await prisma.voteNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** 鯖ちゃんねる Vote通知設定を削除する */
export async function deleteVoteNotice(guildId: string) {
  return await prisma.voteNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** 鯖ちゃんねる Vote通知の無効化設定を取得する */
export async function findVoteNoticeIgnore(guildId: string) {
  return await prisma.voteNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** 鯖ちゃんねる Vote通知の無効化設定を作成する */
export async function createVoteNoticeIgnore(guildId: string) {
  return await prisma.voteNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** 鯖ちゃんねる Vote通知の無効化設定を削除する */
export async function deleteVoteNoticeIgnore(guildId: string) {
  return await prisma.voteNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}
/** Dicoall UP通知設定を取得する */
export async function findDicoallNotice(guildId: string) {
  return await prisma.dicoallNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** Dicoall UP通知設定を作成する */
export async function createDicoallNotice(guildId: string, roleId: string) {
  return await prisma.dicoallNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** Dicoall UP通知設定を作成または更新する */
export async function upsertDicoallNotice(guildId: string, roleId: string) {
  return await prisma.dicoallNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** Dicoall UP通知設定を削除する */
export async function deleteDicoallNotice(guildId: string) {
  return await prisma.dicoallNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** Dicoall UP通知の無効化設定を取得する */
export async function findDicoallNoticeIgnore(guildId: string) {
  return await prisma.dicoallNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** Dicoall UP通知の無効化設定を作成する */
export async function createDicoallNoticeIgnore(guildId: string) {
  return await prisma.dicoallNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** Dicoall UP通知の無効化設定を削除する */
export async function deleteDicoallNoticeIgnore(guildId: string) {
  return await prisma.dicoallNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}
/** Discord Cafe UP通知設定を取得する */
export async function findDcafeNotice(guildId: string) {
  return await prisma.dcafeNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** Discord Cafe UP通知設定を作成する */
export async function createDcafeNotice(guildId: string, roleId: string) {
  return await prisma.dcafeNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** Discord Cafe UP通知設定を作成または更新する */
export async function upsertDcafeNotice(guildId: string, roleId: string) {
  return await prisma.dcafeNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** Discord Cafe UP通知設定を削除する */
export async function deleteDcafeNotice(guildId: string) {
  return await prisma.dcafeNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** Discord Cafe UP通知の無効化設定を取得する */
export async function findDcafeNoticeIgnore(guildId: string) {
  return await prisma.dcafeNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** Discord Cafe UP通知の無効化設定を作成する */
export async function createDcafeNoticeIgnore(guildId: string) {
  return await prisma.dcafeNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** Discord Cafe UP通知の無効化設定を削除する */
export async function deleteDcafeNoticeIgnore(guildId: string) {
  return await prisma.dcafeNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}
/** SharkBot UP通知設定を取得する */
export async function findSharkbotNotice(guildId: string) {
  return await prisma.sharkbotNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** SharkBot UP通知設定を作成する */
export async function createSharkbotNotice(guildId: string, roleId: string) {
  return await prisma.sharkbotNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** SharkBot UP通知設定を作成または更新する */
export async function upsertSharkbotNotice(guildId: string, roleId: string) {
  return await prisma.sharkbotNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** SharkBot UP通知設定を削除する */
export async function deleteSharkbotNotice(guildId: string) {
  return await prisma.sharkbotNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** SharkBot UP通知の無効化設定を取得する */
export async function findSharkbotNoticeIgnore(guildId: string) {
  return await prisma.sharkbotNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** SharkBot UP通知の無効化設定を作成する */
export async function createSharkbotNoticeIgnore(guildId: string) {
  return await prisma.sharkbotNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** SharkBot UP通知の無効化設定を削除する */
export async function deleteSharkbotNoticeIgnore(guildId: string) {
  return await prisma.sharkbotNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}
/** DiscordServers.io BUMP通知設定を取得する */
export async function findDsioNotice(guildId: string) {
  return await prisma.dsioNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** DiscordServers.io BUMP通知設定を作成する */
export async function createDsioNotice(guildId: string, roleId: string) {
  return await prisma.dsioNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** DiscordServers.io BUMP通知設定を作成または更新する */
export async function upsertDsioNotice(guildId: string, roleId: string) {
  return await prisma.dsioNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** DiscordServers.io BUMP通知設定を削除する */
export async function deleteDsioNotice(guildId: string) {
  return await prisma.dsioNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** DiscordServers.io BUMP通知の無効化設定を取得する */
export async function findDsioNoticeIgnore(guildId: string) {
  return await prisma.dsioNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** DiscordServers.io BUMP通知の無効化設定を作成する */
export async function createDsioNoticeIgnore(guildId: string) {
  return await prisma.dsioNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** DiscordServers.io BUMP通知の無効化設定を削除する */
export async function deleteDsioNoticeIgnore(guildId: string) {
  return await prisma.dsioNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}
/** DISCOM UP通知設定を取得する */
export async function findDiscomNotice(guildId: string) {
  return await prisma.discomNotice.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** DISCOM UP通知設定を作成する */
export async function createDiscomNotice(guildId: string, roleId: string) {
  return await prisma.discomNotice.create({
    data: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** DISCOM UP通知設定を作成または更新する */
export async function upsertDiscomNotice(guildId: string, roleId: string) {
  return await prisma.discomNotice.upsert({
    where: {
      guildId: guildId,
    },
    update: {
      roleId: roleId,
    },
    create: {
      guildId: guildId,
      roleId: roleId,
    },
  });
}

/** DISCOM UP通知設定を削除する */
export async function deleteDiscomNotice(guildId: string) {
  return await prisma.discomNotice.delete({
    where: {
      guildId: guildId,
    },
  });
}

/** DISCOM UP通知の無効化設定を取得する */
export async function findDiscomNoticeIgnore(guildId: string) {
  return await prisma.discomNoticeIgnore.findUnique({
    where: {
      guildId: guildId,
    },
  });
}

/** DISCOM UP通知の無効化設定を作成する */
export async function createDiscomNoticeIgnore(guildId: string) {
  return await prisma.discomNoticeIgnore.create({
    data: {
      guildId: guildId,
    },
  });
}

/** DISCOM UP通知の無効化設定を削除する */
export async function deleteDiscomNoticeIgnore(guildId: string) {
  return await prisma.discomNoticeIgnore.delete({
    where: {
      guildId: guildId,
    },
  });
}
