import { Client, Message, Colors, PermissionFlagsBits, ChannelType } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import config from "@/config";
import { prisma } from "@/util/db";
import { NotificationQueueService } from "@/util/NotificationQueue";
import { NotificationType } from "@/generated";
import { buildBumpRtaEmbed, finishBumpRtaRound, resolveBumpActorId } from "@/util/bumpRta";

class BumpEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (
      message.author.id !== config.bot.disboardId ||
      !message.inGuild() ||
      message.channel.type !== ChannelType.GuildText ||
      !message.guild.members.me ||
      !message.guild.members.me
        .permissionsIn(message.channel)
        .has(PermissionFlagsBits.ViewChannel) ||
      !message.guild.members.me.permissionsIn(message.channel).has(PermissionFlagsBits.SendMessages)
    )
      return;

    if (
      message.embeds[0]?.description &&
      (message.embeds[0]?.description.match(/表示順をアップしたよ/) ||
        message.embeds[0]?.description.match(/Bump done/))
    ) {
      const bumpNoticeIgnoreData = await prisma.bumpNoticeIgnore.findUnique({
        where: {
          guildId: message.guild.id,
        },
      });

      if (bumpNoticeIgnoreData) return;

      // 既に同じ通知が予約済みなら、受信メッセージも含めて何もしない (重複防止)
      const created = await NotificationQueueService.add({
        guildId: message.guild.id,
        channelId: message.channel.id,
        type: NotificationType.bump,
        delay: 7200000,
      });

      if (created) {
        await message.channel
          .send({
            embeds: [
              {
                color: Colors.White,
                title: "BUMP通知",
                description: `BUMPを受信しました\n2時間後に通知します`,
              },
            ],
          })
          .catch(() => {});
      }

      // RTA: 通知からのラウンドがあれば、この bump を記録する
      const actorId = resolveBumpActorId(message);
      if (actorId) {
        const result = await finishBumpRtaRound(
          message.guild.id,
          NotificationType.bump,
          actorId,
        );
        if (result) {
          await message.channel
            .send({ embeds: [buildBumpRtaEmbed(NotificationType.bump, actorId, result)] })
            .catch(() => {});
        }
      }
    }
  }
}

export default BumpEvent;
