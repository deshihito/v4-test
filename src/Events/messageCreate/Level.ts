import { Client, Message, Colors } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import config from "@/config";
import {
  grantLevelChatExp,
  findLevelUser,
  createLevelUser,
  findLevelSetting,
  findLevelGuildSetting,
} from "@/Models/Level";
import calcLevel from "@/util/calcLevel";
import { v2 } from "@/util/v2";

const GRANT_EXP = 5;
const GRANT_INTERVAL = 5 * 60 * 1000;

class LevelEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || !message.inGuild()) return;

    const userId: string = message.author.id;
    const guildId: string = message.guild.id;
    const now = new Date();

    // 付与間隔のチェックと加算を条件付き更新でアトミックに行う
    // (チェックと加算の間に別の発言が割り込んでも二重付与しない)。
    const grant = () => grantLevelChatExp(userId, guildId, now, GRANT_EXP, GRANT_INTERVAL);

    const updated = await grant();

    if (updated.count === 0) {
      const existing = await findLevelUser(userId, guildId);

      if (existing) return;

      try {
        await createLevelUser({ userId, guildId, chatExp: GRANT_EXP, lastChatGrant: now });
      } catch {
        // 同時に作成されていた場合は、勝った側の付与が立っているので
        // 条件付き更新をやり直して間隔内なら何もしない。
        const retried = await grant();
        if (retried.count === 0) return;
      }
    }

    const after = await findLevelUser(userId, guildId);

    if (!after) return;

    const oldLevel: number = calcLevel(after.chatExp - GRANT_EXP).level;
    const newLevel: number = calcLevel(after.chatExp).level;

    if (newLevel <= oldLevel) return;

    const setting = await findLevelSetting(userId);

    if (setting && !setting.notify) return;

    // 通知先: ギルド設定のチャンネルがあればそこ、無ければ発言したチャンネル。
    // 設定先が取得できない・送信できない場合は発言したチャンネルにフォールバックする。
    let target = message.channel;
    const guildSetting = await findLevelGuildSetting(guildId);
    if (guildSetting?.notifyChannelId) {
      const configured = await this.client.channels
        .fetch(guildSetting.notifyChannelId)
        .catch(() => null);
      if (configured && configured.isSendable() && configured.guildId === guildId) {
        target = configured;
      }
    }

    await target
      .send(v2({
        ...(setting?.mention === false ? {} : { content: `<@${userId}>` }),
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "レベルアップ",
              icon_url: config.image.successIcon,
            },
            description: `Lv.${oldLevel}からLv.${newLevel}に上がりました\n現在のEXPは${after.chatExp}です`,
          },
        ],
      }))
      .catch(() => {});
  }
}

export default LevelEvent;
