import { Client, Message } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import {
  existsGuildStatistics,
  queueGuildStatisticsMessage,
} from "@/Models/GuildStatistics";

class StatsEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || !message.inGuild()) return;

    if (!(await existsGuildStatistics(message.guild.id))) return;

    queueGuildStatisticsMessage(message.guild.id);
  }
}

export default StatsEvent;
