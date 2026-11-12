import {
  ForumChannel,
  MediaChannel,
  NewsChannel,
  StageChannel,
  TextChannel,
  VoiceChannel,
} from "discord.js";

async function deleteDuplicateWebhook(
  channel: NewsChannel | StageChannel | TextChannel | VoiceChannel | ForumChannel | MediaChannel,
  nameList: string[],
) {
  if (channel.isTextBased() && !!channel?.fetchWebhooks) {
    try {
      let oldWebHook = await channel.fetchWebhooks();
      oldWebHook = oldWebHook.filter(
        (wh) => wh.owner?.id === channel.client.user?.id && nameList.includes(wh.name),
      );

      for (const wh of oldWebHook) {
        await wh[1].delete();
      }

      console.info(`重複Webhookの削除処理成功: ${oldWebHook.size}個: [${nameList.join(", ")}]`);

      return oldWebHook.size || 0;
    } catch {
      return -1;
    }
  }
  return -2;
}

export default deleteDuplicateWebhook;
