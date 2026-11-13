import { Client, Message } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import { findAutoReactEmojis } from "@/Models/AutoReact";
import { normalizeEmojiInput } from "@/Models/Binjou";

class AutoReactEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (!message.inGuild() || message.author.bot) return;

    const emojis = await findAutoReactEmojis(message.guild.id, message.channelId);
    for (const emoji of emojis) {
      try {
        await message.react(normalizeEmojiInput(emoji).display);
      } catch {}
    }
  }
}

export default AutoReactEvent;
