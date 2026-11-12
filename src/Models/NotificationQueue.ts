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
  /**
   * 期限が来た通知をアトミックに claim して返す。
   * claim は1回の UPDATE で行い、SKIP LOCKED で行を掴むため、
   * 複数の送信処理が同時に走っても同じ通知が二重に渡ることはない。
   * claim から10分以上経った行は、送信側が落ちたとみなして再 claim できる。
   */
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

  /**
   * 通知をキューへ追加する。追加したら true、見送ったら false を返す。
   * 同じ guild + type の行があっても、それがまだ期限前なら本物の重複として見送る。
   * 期限到来済み (送信処理中を含む) の行は前回分なので、差し替えて登録する。
   * 差し替えないと、前回の通知が送信されるまでの間に来た新しい bump/up が
   * 一意制約で黙って捨てられてしまう。
   */
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
        // (guildId, type) の一意制約に触れた場合だけ「既にある」として扱う
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

    // 送信側の remove は id 指定の deleteMany なので、ここで消しても競合しない
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
