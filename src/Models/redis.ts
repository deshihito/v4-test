import Redis from "ioredis";
import { env } from "@/util/Env";

export const shardRedis = new Redis(env.SHARD_REDIS);

try {
  if (
    shardRedis.status !== "connect" &&
    shardRedis.status !== "connecting" &&
    shardRedis.status !== "ready"
  ) {
    await shardRedis.connect();
  }
} catch (error) {
  console.error(error);
}

shardRedis.on("error", (e) => {
  console.log(`[${new Date()}] Shard ${env.SHARDS},`, e);
});
