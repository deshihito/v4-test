import { Client } from "discord.js";
import { ShardStats } from "@/@types/Util";
import config from "@/config";

export const getShardStatus = async (client: Client): Promise<ShardStats[]> => {
  if (!client.shard) {
    return [
      {
        shardId: 0,
        status: client.ws.status.toString(),
        ping: client.ws.ping,
        guildCount: client.guilds.cache.filter((g) => g.available).size,
        userCount: client.guilds.cache
          .filter((g) => g.available)
          .reduce((acc, guild) => acc + guild.memberCount, 0),
      },
    ];
  }

  const shardStatuses: ShardStats[] = [];

  if (client.shard.count < config.shardCount) {
    return shardStatuses;
  }

  const results = await client.shard.broadcastEval((c) => ({
    guildCount: c.guilds.cache.filter((g) => g.available).size,
    memberCount: c.guilds.cache
      .filter((g) => g.available)
      .reduce((acc, guild) => acc + guild.memberCount, 0),
    status: c.ws.status.toString(),
    ping: c.ws.ping,
    shardId: (c as any).shard.ids[0],
  }));

  results.forEach((data, index) => {
    shardStatuses.push({
      shardId: data.shardId ?? index,
      status: data.status,
      ping: data.ping,
      guildCount: data.guildCount,
      userCount: data.memberCount,
    });
  });

  return shardStatuses;
};