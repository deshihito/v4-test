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
