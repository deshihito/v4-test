import { Client, Message, ChannelType } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import { deletePublish, findPublish } from "@/Models/Publish";

class PublishEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || message.channel.type !== ChannelType.GuildAnnouncement) return;

    const publishData = await findPublish(message.channelId);

    if (!publishData) return;

    try {
      if (message.reference) return;

      await message.crosspost();
      await message.react("✅");
    } catch (error) {
      await deletePublish(message.channelId);
    }
  }
}

export default PublishEvent;
