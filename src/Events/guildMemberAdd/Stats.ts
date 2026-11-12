import { Client, GuildMember } from "discord.js";
import { GuildMemberAddEvent } from "@/@types/Util";
import { findGuildStatistics, incrementGuildStatisticsTotalJoin } from "@/Models/GuildStatistics";

class StatsEvent implements GuildMemberAddEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(member: GuildMember): Promise<void> {
    const stats = await findGuildStatistics(member.guild.id);

    if (!stats) return;

    await incrementGuildStatisticsTotalJoin(member.guild.id);
  }
}

export default StatsEvent;
