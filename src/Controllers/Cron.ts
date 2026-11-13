import { Client, Colors } from "discord.js";
import cron from "node-cron";
import { countCommandHistorySince } from "@/Models/CommandHistory";
import { createSystemLog } from "@/Models/SystemLog";
import { createShardStatus } from "@/Models/ShardStatus";
import {
  flushGuildStatisticsMessages,
  resetAllGuildStatistics,
} from "@/Models/GuildStatistics";
import { deleteExpiredMuteIp } from "@/Models/MuteIp";
import { deleteExpiredWebauth } from "@/Models/Webauth";
import { deleteExpiredCommandCooldown } from "@/Models/CommandCooldown";
import { findBumpNotice, findUpNotice } from "@/Models/BoardNotice";
import Log from "@/util/Log";
import getUserCount from "@/Models/getUserCount";
import getGuildCount from "@/Models/getGuildCount";
import { NotificationQueueService } from "@/Models/NotificationQueue";
import { BOARD_SERVICE_BY_TYPE } from "@/Models/boardServices";
import { startBumpRtaRound } from "@/Models/bumpRta";
import { NotificationType } from "@/generated";
import { env } from "@/util/Env";
import { getShardStatus } from "@/Models/getShardStatus";
import { v2 } from "@/util/v2";

class Cron {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;

    if (client.shard && env.SHARDS !== "0") return;

    Log.info("Cronを起動しました");

    cron.schedule("0 0 * * *", () => {
      this.deleteMuteIp();
      this.resetGuildStatistics();
    });

    cron.schedule("0 * * * *", () => {
      this.deleteCommandCooldown();
      this.recordSystemLog();
    });

    cron.schedule("* * * * *", () => {
      this.deleteExpiredAuth();
      this.sendNotifications();
      this.recordShardStatus();
      this.flushGuildStatistics();
    });
  }

  private async recordSystemLog(): Promise<void> {
    const commandCount = await countCommandHistorySince(new Date(Date.now() - 3600000));

    const loggedAt = new Date();

    loggedAt.setMinutes(0, 0, 0);

    await createSystemLog({
      ping: this.client.ws.ping,
      totalUser: await getUserCount(this.client),
      totalGuild: await getGuildCount(this.client),
      totalCommand: commandCount,
      loggedAt: loggedAt,
    });

    Log.debug("システムログを記録しました");
  }

  private async recordShardStatus(): Promise<void> {
    const shardData = await getShardStatus(this.client);

    await createShardStatus(JSON.stringify(shardData));
  }

  private async resetGuildStatistics(): Promise<void> {
    await resetAllGuildStatistics();

    Log.debug(`サーバー統計情報を削除しました`);
  }

  private async flushGuildStatistics(): Promise<void> {
    await flushGuildStatisticsMessages().catch(() => {});
  }

  private async deleteMuteIp(): Promise<void> {
    const { count } = await deleteExpiredMuteIp(new Date(Date.now() - 2592000000));

    if (count === 0) return;

    Log.debug(`1か月以上経過した${count}個のMuteIpを削除しました`);
  }

  private async deleteExpiredAuth(): Promise<void> {
    const { count } = await deleteExpiredWebauth(new Date(Date.now() - 300000));

    if (count === 0) return;

    Log.debug(`5分以上経過した${count}個の無効なWeb認証セッションを削除しました`);
  }

  private async deleteCommandCooldown(): Promise<void> {
    const { count } = await deleteExpiredCommandCooldown(new Date(Date.now() - 604800000));

    if (count === 0) return;

    Log.debug(`1週間以上経過した${count}個のCommandCoolDownを削除しました`);
  }

  private sendingNotifications = false;

  private async sendNotifications(): Promise<void> {

    if (this.sendingNotifications) return;
    this.sendingNotifications = true;

    try {
      const notificationsToSend = await NotificationQueueService.claimDue(100);

      const CHUNK_SIZE = 25;

      for (let i = 0; i < notificationsToSend.length; i += CHUNK_SIZE) {
        const chunk = notificationsToSend.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async (notification) => {
            const guild = await this.client.guilds.fetch(notification.guildId).catch(() => null);
            if (!guild) {
              await NotificationQueueService.remove(notification.id);
              return;
            }
            const channel = await guild.channels.fetch(notification.channelId).catch(() => null);
            if (!channel || !channel.isTextBased()) {
              await NotificationQueueService.remove(notification.id);
              return;
            }

            let sent = false;

            if (notification.type === NotificationType.bump) {
              const bumpNoticeData = await findBumpNotice(notification.guildId);

              sent = await channel
                .send(v2({
                  content: bumpNoticeData ? `<@&${bumpNoticeData.roleId}>` : "",
                  embeds: [
                    {
                      color: Colors.White,
                      title: "BUMP通知",
                      description:
                        "BUMPの時間です\n</bump:947088344167366698>でサーバーの表示順位を上げよう！",
                    },
                  ],
                }))
                .then(() => true)
                .catch(() => false);
            } else if (notification.type === NotificationType.dissoku) {
              const upNoticeData = await findUpNotice(notification.guildId);
              sent = await channel
                .send(v2({
                  content: upNoticeData ? `<@&${upNoticeData.roleId}>` : "",
                  embeds: [
                    {
                      color: Colors.Blue,
                      title: "Dissoku UP通知",
                      description:
                        "UPの時間です\n</up:1363739182672904354>でサーバーの表示順位を上げよう！",
                    },
                  ],
                }))
                .then(() => true)
                .catch(() => false);
            } else if (notification.type === NotificationType.tksmup) {
              const upNoticeData = await findUpNotice(notification.guildId);

              sent = await channel
                .send(v2({
                  content: upNoticeData ? `<@&${upNoticeData.roleId}>` : "",
                  embeds: [
                    {
                      color: Colors.Green,
                      title: "TakasumiBOT UP通知",
                      description:
                        "UPの時間です\n</up:1135405664852783157>でサーバーの表示順位を上げよう！",
                    },
                  ],
                }))
                .then(() => true)
                .catch(() => false);
            } else {
              const boardService = BOARD_SERVICE_BY_TYPE[notification.type];
              if (boardService) {
                const boardNoticeData = await boardService.findNotice(notification.guildId);

                sent = await channel
                  .send(v2({
                    content: boardNoticeData ? `<@&${boardNoticeData.roleId}>` : "",
                    embeds: [
                      {
                        color: boardService.notifyColor,
                        title: boardService.notifyTitle,
                        description: boardService.notifyDescription,
                      },
                    ],
                  }))
                  .then(() => true)
                  .catch(() => false);
              }
            }

            if (sent) {
              await startBumpRtaRound(notification.guildId, notification.type, notification.channelId);
            }

            await NotificationQueueService.remove(notification.id);
          }),
        );

        if (i + CHUNK_SIZE < notificationsToSend.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } finally {
      this.sendingNotifications = false;
    }
  }
}

export default Cron;
