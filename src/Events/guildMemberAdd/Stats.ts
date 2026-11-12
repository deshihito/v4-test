import { Client, GuildMember } from "discord.js";
import { GuildMemberAddEvent } from "@/@types/Util";
import { prisma } from "@/Models/db";

class StatsEvent implements GuildMemberAddEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(member: GuildMember): Promise<void> {
    const stats = await prisma.guildStatistics.findUnique({
      where: {
        guildId: member.guild.id,
      },
    });

    if (!stats) return;

    await prisma.guildStatistics.update({
      where: {
        guildId: member.guild.id,
      },
      data: {
        totalJoin: {
          increment: 1,
        },
      },
    });
  }
}

export default StatsEvent;
