import { Client, Message } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import { getBotControl, planBotControl } from "@/Models/BotFixer";

class BotControlEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (!message.inGuild() || !message.author.bot) return;
    if (this.client.user && message.author.id === this.client.user.id) return;

    if (message.webhookId) {
      if (!message.applicationId || message.applicationId !== message.author.id) return;
    }

    const entries = await getBotControl(message.guild.id);
    const entry = entries.find((candidate) => candidate.botId === message.author.id);
    if (!entry) return;

    const reason = planBotControl(entry, message.guild.id, message.channelId);
    if (!reason) return;

    await message.delete().catch(() => {});
  }
}

export default BotControlEvent;
