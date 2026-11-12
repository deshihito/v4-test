import { prisma } from "@/Models/db";
import { NotificationType } from "@/generated";

interface IAddNotificationOptions {
  guildId: string;
  channelId: string;
  type: NotificationType;
  delay: number;
}

export interface INotification {
  id: number;
  guildId: string;
  channelId: string;
  type: NotificationType;
  scheduledAt: Date;
  claimedAt: Date | null;
}

export class NotificationQueueService {

  public static async claimDue(limit = 100): Promise<INotification[]> {
    return await prisma.$queryRaw<INotification[]>`
      UPDATE "NotificationQueue" AS q
      SET "claimedAt" = NOW()
      WHERE q."id" IN (
        SELECT "id" FROM "NotificationQueue"
        WHERE "scheduledAt" <= NOW()
          AND ("claimedAt" IS NULL OR "claimedAt" < NOW() - INTERVAL '10 minutes')
        ORDER BY "scheduledAt"
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING q."id", q."guildId", q."channelId", q."type", q."scheduledAt", q."claimedAt"`;
  }

  public static async add(options: IAddNotificationOptions): Promise<boolean> {
    const create = async (): Promise<boolean> => {
      try {
        await prisma.notificationQueue.create({
          data: {
            guildId: options.guildId,
            channelId: options.channelId,
            type: options.type,
            scheduledAt: new Date(Date.now() + options.delay),
          },
        });
        return true;
      } catch (error) {

        if ((error as { code?: string }).code === "P2002") return false;
        throw error;
      }
    };

    if (await create()) return true;

    const existing = await prisma.notificationQueue.findUnique({
      where: {
        guildId_type: {
          guildId: options.guildId,
          type: options.type,
        },
      },
    });
    if (existing && existing.scheduledAt > new Date()) return false;

    await prisma.notificationQueue.deleteMany({
      where: {
        guildId: options.guildId,
        type: options.type,
      },
    });
    return await create();
  }

  public static remove(id: number) {
    return prisma.notificationQueue.deleteMany({
      where: { id },
    });
  }
}
