import { prisma } from "@/Models/db";

/** シャードの状態を記録する */
export async function createShardStatus(data: string) {
  return await prisma.shardStatus.create({
    data: {
      data: data,
    },
  });
}
