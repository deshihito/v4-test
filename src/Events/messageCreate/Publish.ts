import { Client, Message, ChannelType } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import { prisma } from "@/Models/db";

class PublishEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || message.channel.type !== ChannelType.GuildAnnouncement) return;

    const publishData = await prisma.publish.findUnique({
      where: {
        channelId: message.channelId,
      },
    });

    if (!publishData) return;

    try {
      if (message.reference) return;

      await message.crosspost();
      await message.react("✅");
    } catch (error) {
      await prisma.publish.delete({
        where: {
          channelId: message.channelId,
        },
      });
    }
  }
}

export default PublishEvent;
