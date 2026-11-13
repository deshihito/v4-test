import {
  Client,
  Message,
  Colors,
  ChannelType,
  OmitPartialGroupDMChannel,
  PartialMessage,
  PermissionFlagsBits,
} from "discord.js";
import { MessageUpdateEvent } from "@/@types/Util";
import config from "@/config";
import { findDissokuNoticeIgnore } from "@/Models/BoardNotice";
import { NotificationQueueService } from "@/Models/NotificationQueue";
import { NotificationType } from "@/generated";
import { buildBumpRtaEmbed, finishBumpRtaRound, resolveBumpActorId } from "@/Models/bumpRta";
import { v2 } from "@/util/v2";

class AfkEvent implements MessageUpdateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>,
    newMessage: OmitPartialGroupDMChannel<Message<boolean>>,
  ): Promise<void> {
    if (
      newMessage.author.id !== config.bot.dissokuId ||
      !newMessage.inGuild() ||
      newMessage.channel.type !== ChannelType.GuildText ||
      !newMessage.guild.members.me ||
      !newMessage.guild.members.me
        .permissionsIn(newMessage.channel)
        .has(PermissionFlagsBits.ViewChannel) ||
      !newMessage.guild.members.me
        .permissionsIn(newMessage.channel)
        .has(PermissionFlagsBits.SendMessages)
    )
      return;

    if (
      newMessage.embeds[0]?.fields[0]?.name &&
      (newMessage.embeds[0]?.fields[0]?.name.match(/をアップしたよ/) ||
        newMessage.embeds[0]?.fields[0]?.name.match(/I've bumped up/))
    ) {
      const dissokuNoticeIgnoreData = await findDissokuNoticeIgnore(newMessage.guild.id);

      if (dissokuNoticeIgnoreData) return;

      const created = await NotificationQueueService.add({
        guildId: newMessage.guild.id,
        channelId: newMessage.channel.id,
        type: NotificationType.dissoku,
        delay: 7200000,
      });

      if (created) {
        await newMessage.channel
          .send(v2({
            embeds: [
              {
                color: Colors.Blue,
                title: "Dissoku UP通知",
                description: `Dissoku UPを受信しました\n2時間後に通知します`,
              },
            ],
          }))
          .catch(() => {});
      }

      const actorId = resolveBumpActorId(newMessage);
      if (actorId) {
        const result = await finishBumpRtaRound(
          newMessage.guild.id,
          NotificationType.dissoku,
          actorId,
        );
        if (result) {
          await newMessage.channel
            .send(v2({ embeds: [buildBumpRtaEmbed(NotificationType.dissoku, actorId, result)] }))
            .catch(() => {});
        }
      }
    }
  }
}

export default AfkEvent;
