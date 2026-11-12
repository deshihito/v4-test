import { Client, Message, Colors, ChannelType } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import config from "@/config";
import { relative } from "path";
import calcTime from "@/util/calcTime";
import matchId from "@/util/matchId";
import { prisma } from "@/Models/db";

class AfkEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || message.channel.type === ChannelType.GroupDM) return;

    try {
      const afkData = await prisma.afk.findUnique({
        where: {
          userId: message.author.id,
        },
      });

      if (afkData) {
        await prisma.afk.delete({
          where: {
            userId: message.author.id,
          },
        });

        await message.channel.send({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "AFKを無効にしました",
                icon_url: config.image.successIcon,
              },
              description: `メンションは${afkData.mention}件ありました\n${calcTime(new Date().getTime() - afkData.createdAt.getTime())}間AFKでした`,
            },
          ],
        });
      } else {
        const mention = message.content.match(/<@\d{17,19}>/g);
        if (!mention) return;

        const id = matchId(mention[0]);
        if (!id) return;

        const OthorAfkData = await prisma.afk.findUnique({
          where: {
            userId: id,
          },
        });

        if (!OthorAfkData) return;

        await prisma.afk.update({
          where: { userId: id },
          data: {
            mention: {
              increment: 1,
            },
          },
        });

        await message.channel.send({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "AFK中です",
                icon_url: config.image.successIcon,
              },
              description: OthorAfkData.message,
            },
          ],
        });
      }
    } catch{
      return;
    }
  }
}

export default AfkEvent;
