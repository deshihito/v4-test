import { Client, Message } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import { prisma } from "@/Models/db";

class StatsEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || !message.inGuild()) return;

    const stats = await prisma.guildStatistics.findUnique({
      where: {
        guildId: message.guild.id,
      },
    });

    if (!stats) return;

    await prisma.guildStatistics.update({
      where: {
        guildId: message.guild.id,
      },
      data: {
        totalMessage: {
          increment: 1,
        },
      },
    });
  }
}

export default StatsEvent;
