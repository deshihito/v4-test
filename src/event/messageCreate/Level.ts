import { Client, Message, Colors } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import config from "@/config";
import { prisma } from "@/util/db";
import calcLevel from "@/util/calcLevel";

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
    const grant = () =>
      prisma.levelUser.updateMany({
        where: {
          userId,
          guildId,
          OR: [
            { lastChatGrant: null },
            { lastChatGrant: { lt: new Date(now.getTime() - GRANT_INTERVAL) } },
          ],
        },
        data: {
          chatExp: { increment: GRANT_EXP },
          lastChatGrant: now,
        },
      });

    const updated = await grant();

    if (updated.count === 0) {
      const existing = await prisma.levelUser.findUnique({
        where: { userId_guildId: { userId, guildId } },
      });

      if (existing) return;

      try {
        await prisma.levelUser.create({
          data: { userId, guildId, chatExp: GRANT_EXP, lastChatGrant: now },
        });
      } catch {
        // 同時に作成されていた場合は、勝った側の付与が立っているので
        // 条件付き更新をやり直して間隔内なら何もしない。
        const retried = await grant();
        if (retried.count === 0) return;
      }
    }

    const after = await prisma.levelUser.findUnique({
      where: { userId_guildId: { userId, guildId } },
    });

    if (!after) return;

    const oldLevel: number = calcLevel(after.chatExp - GRANT_EXP).level;
    const newLevel: number = calcLevel(after.chatExp).level;

    if (newLevel <= oldLevel) return;

    const setting = await prisma.levelSetting.findUnique({
      where: { userId },
    });

    if (setting && !setting.notify) return;

    await message.channel
      .send({
        content: `<@${userId}>`,
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
      })
      .catch(() => {});
  }
}

export default LevelEvent;
