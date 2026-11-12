import { Client, Message } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import {
  findGuildStatistics,
  incrementGuildStatisticsTotalMessage,
} from "@/Models/GuildStatistics";

class StatsEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || !message.inGuild()) return;

    const stats = await findGuildStatistics(message.guild.id);

    if (!stats) return;

    await incrementGuildStatisticsTotalMessage(message.guild.id);
  }
}

export default StatsEvent;
