import { Client, GuildMember, PartialGuildMember } from "discord.js";
import { GuildMemberAddEvent } from "@/@types/Util";
import {
  findGuildStatistics,
  incrementGuildStatisticsTotalLeave,
} from "@/Models/GuildStatistics";

class StatsEvent implements GuildMemberAddEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(member: GuildMember | PartialGuildMember): Promise<void> {
    const stats = await findGuildStatistics(member.guild.id);

    if (!stats) return;

    await incrementGuildStatisticsTotalLeave(member.guild.id);
  }
}

export default StatsEvent;
