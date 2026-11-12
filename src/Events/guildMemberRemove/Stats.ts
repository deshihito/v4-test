import { Client, GuildMember, PartialGuildMember } from "discord.js";
import { GuildMemberAddEvent } from "@/@types/Util";
import { prisma } from "@/Models/db";

class StatsEvent implements GuildMemberAddEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(member: GuildMember | PartialGuildMember): Promise<void> {
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
        totalLeave: {
          increment: 1,
        },
      },
    });
  }
}

export default StatsEvent;
