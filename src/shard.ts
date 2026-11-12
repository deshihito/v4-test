import { Shard, ShardingManager } from "discord.js";
import Log from "@/util/Log";
import config from "@/config";
import Notice from "@/Models/Notice";
import { env } from "@/util/Env";
//import "./Models/redis"; //redisの接続処理のためにロード。副作用(接続処理)のみ動作します。

const manager = new ShardingManager("./src/index.ts", {
  token: env.BOT_TOKEN,
  totalShards: config.shardCount,
  respawn: true,
  shardList: env.SHARD_LIST.split(",").map((s: string | number) => (s = Number(s))),
});

Log.info("シャード起動中");

manager.on("shardCreate", (shard: Shard) => {
  Log.debug(`Create Shard ${shard.id}`);
  console.time(`Time until Shard ${shard.id} ready event`);

  shard.on("ready", async () => {
    Log.debug(`Shard ${shard.id}'s ready.`);
    console.timeEnd(`Time until Shard ${shard.id} ready event`);
  });

  shard.on("disconnect", async () => {
    Log.warn(`${shard.id}番シャードが切断されました`);
    await Notice.sendWarn(`${shard.id}番シャードが切断されました`);
  });

  shard.on("reconnecting", async () => {
    Log.warn(`${shard.id}番シャードが再接続中です`);
  });

  shard.on("death", async () => {
    Log.error(`${shard.id}番シャードが終了しました`);
    await Notice.sendError(`${shard.id}番シャードが終了しました`);
  });
});

manager.spawn({ timeout: 300000, delay: 7000 });
