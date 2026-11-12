import { Client } from "discord.js";
import { shardRedis } from "@/Models/redis";
import config from "@/config";

const getPingAvg = async (client: Client): Promise<number> => {
  if (client.shard) {
    const keys = Array.from({ length: config.shardCount }, (_, i) => `shard:status:ping:${i}`);
    try {
      const pingList = (await shardRedis.mget(keys))
        .map((s: string | null | number) => parseInt(String(s), 10) || 0)
        .filter((n) => n);
      if (pingList.length === 0) {
        throw new Error("pingList is empty array.");
      }
      return Math.round((pingList.reduce((sum, n) => sum + n, 0) / pingList.length) * 10) / 10;
    } catch (error) {
      console.error("getPing.ts", error);
      return -1;
    }
  } else {
    return client.ws.ping;
  }
};

export default getPingAvg;
