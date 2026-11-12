import { prisma } from "@/Models/db";

/** システムログを記録する */
export async function createSystemLog(data: {
  ping: number;
  totalUser: number;
  totalGuild: number;
  totalCommand: number;
  loggedAt: Date;
}) {
  return await prisma.systemLog.create({ data });
}
