import { prisma } from "@/Models/db";

/** ユーザーのアドレス情報を取得する */
export async function findUserAddress(userId: string) {
  return await prisma.userAddress.findUnique({
    where: {
      userId: userId,
    },
  });
}

/** 一時通報を作成する */
export async function createTmpReport(data: {
  id: string;
  targetType: "user" | "guild";
  targetId: string;
  title: string;
  reason: string;
  reporterId: string;
}) {
  return await prisma.tmpReport.create({ data });
}

/** 一時通報を取得する */
export async function findTmpReport(id: string) {
  return await prisma.tmpReport.findUnique({
    where: {
      id: id,
    },
  });
}

/** 一時通報を削除する */
export async function deleteTmpReport(id: string) {
  return await prisma.tmpReport.delete({
    where: {
      id: id,
    },
  });
}

/** 通報を作成する */
export async function createReport(data: {
  id: string;
  targetId: string;
  targetType: "user" | "guild";
  title: string;
  reason: string;
  reporterId: string;
  originalTitle: string;
  originalReason: string;
  action:
    | "muteUser"
    | "unMuteUser"
    | "muteIp"
    | "unMuteIp"
    | "muteGuild"
    | "unMuteGuild"
    | "warn"
    | "delete";
  originalCreatedAt: Date;
}) {
  return await prisma.report.create({ data });
}
