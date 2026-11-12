import { shardRedis } from "@/Models/redis";

async function getMemoryUsageAvg() {
  let all = 0;
  let count = 0;
  let invalid = 0;
  let valid = 0;
  while (invalid < 4) {
    const value = await shardRedis.get(`shard:machine:ram:${count++}`);
    if (value == null || !isFinite(Number(value))) {
      invalid++;
      continue;
    }
    valid++;
    all += Number(value);
  }

  return valid > 0 ? Math.round(all / valid) : -1;
}

export default getMemoryUsageAvg;
