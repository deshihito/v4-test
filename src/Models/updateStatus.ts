import { Client } from "discord.js";
import { shardRedis } from "@/Models/redis";
import { env } from "@/util/Env";

async function updateStatus(client: Client) {
  try {
    const availableGuild = client.guilds.cache.filter((g) => g.available);
    await Promise.all([
      shardRedis.set(`shard:status:ping:${env.SHARDS}`, client.ws.ping),
      shardRedis.set(
        `shard:status:user:${env.SHARDS}`,
        availableGuild.reduce((a, g) => a + g.memberCount, 0),
      ),
      shardRedis.set(`shard:status:guild:${env.SHARDS}`, availableGuild.size),
    ]);
  } catch (error) {
    console.error(`Shard ID: ${env.SHARDS}`, error);
  }
}

export default updateStatus;
