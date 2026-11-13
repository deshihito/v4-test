import { Client, Message } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import { findStickySetting, resendStickyPanel } from "@/Models/Sticky";

class StickyEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (!message.inGuild() || message.author.bot) return;

    const settings = await findStickySetting(message.guild.id);
    if (!settings.enabled || settings.channelId !== message.channelId) return;

    await resendStickyPanel(this.client, message.guild.id);
  }
}

export default StickyEvent;
