import { Client, GatewayIntentBits } from "discord.js";
import config from "@/config";
import Handler from "@/Controllers/Handler";
import Cron from "@/Controllers/Cron";
import Log from "@/util/Log";
import { ShardStats } from "@/@types/Util";
import { env } from "@/util/Env";
import { shardRedis } from "@/Models/redis";
import updateStatus from "@/Models/updateStatus";

const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  sweepers: {
    messages: {
      interval: config.cacheLimit,
      lifetime: config.cacheLimit,
    },
    reactions: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    presences: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    invites: {
      interval: config.cacheLimit,
      lifetime: config.cacheLimit,
    },
    emojis: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    threads: {
      interval: config.cacheLimit,
      lifetime: config.cacheLimit,
    },
    threadMembers: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    stickers: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    bans: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    voiceStates: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    stageInstances: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    applicationCommands: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    autoModerationRules: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
    entitlements: {
      interval: config.cacheLimit,
      filter: () => () => true,
    },
  },
});

new Handler(client);
new Cron(client);

// MARK: Redis関連処理
shardRedis.on("reconnecting", () => {
  updateStatus(client);
});

client.login(env.BOT_TOKEN).then(() => {
  Log.info(`${env.SHARDS ? `${env.SHARDS}番シャードが` : ""}ログインしました`);
});

process.on("uncaughtException", (error: Error) => {
  if (error.message === "Shards are still being spawned.") return;
  if (!error.stack) return;

  Log.error(error.stack);
});

process.on("unhandledRejection", (reason: any) => {
  if (reason?.message === "Shards are still being spawned.") return;
  console.log(reason);
  Log.error(reason as string);
});
