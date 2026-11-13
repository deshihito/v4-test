import { Client, Message, Colors, PermissionFlagsBits, ChannelType } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import config from "@/config";
import { findBumpNoticeIgnore } from "@/Models/BoardNotice";
import { NotificationQueueService } from "@/Models/NotificationQueue";
import { NotificationType } from "@/generated";
import { buildBumpRtaEmbed, finishBumpRtaRound, resolveBumpActorId } from "@/Models/bumpRta";
import { v2 } from "@/util/v2";

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
      const bumpNoticeIgnoreData = await findBumpNoticeIgnore(message.guild.id);

      if (bumpNoticeIgnoreData) return;

      const created = await NotificationQueueService.add({
        guildId: message.guild.id,
        channelId: message.channel.id,
        type: NotificationType.bump,
        delay: 7200000,
      });

      if (created) {
        await message.channel
          .send(v2({
            embeds: [
              {
                color: Colors.White,
                title: "BUMP通知",
                description: `BUMPを受信しました\n2時間後に通知します`,
              },
            ],
          }))
          .catch(() => {});
      }

      const actorId = resolveBumpActorId(message);
      if (actorId) {
        const result = await finishBumpRtaRound(
          message.guild.id,
          NotificationType.bump,
          actorId,
        );
        if (result) {
          await message.channel
            .send(v2({ embeds: [buildBumpRtaEmbed(NotificationType.bump, actorId, result)] }))
            .catch(() => {});
        }
      }
    }
  }
}

export default BumpEvent;
