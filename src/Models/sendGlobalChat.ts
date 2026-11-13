import { prisma } from "@/Models/db";
import config from "@/config";
import { Colors } from "discord.js";
import { APIMessage } from "discord.js";
import crypto from "node:crypto";
import { SendGlobalChatOptions } from "@/@types/Util";
import { v2Json } from "@/util/v2";

// 送信機能のみ持つユーティリティです
// 【注意】送信条件の検証は別途行うこと

async function sendGlobalChat({
  title,
  desc,
  footerText,
  thumbnailUrl,
  fromServerId,
  fromUserId,
  fromChannelId,
  fromMessageId,
  userName,
}: SendGlobalChatOptions) {
  const history = await prisma.globalChatHistory.create({
    data: {
      userId: fromUserId ?? "0",
      guildId: fromServerId ?? "0",
      channelId: fromChannelId ?? "0",
      messageId: fromMessageId ?? "0",
    },
  });

  const globalChatData = await prisma.globalChat.findMany();

  globalChatData.forEach(async (gcData) => {
    if (gcData.guildId === fromServerId) return; //送信元のサーバーに送信しない

    const webhookdata = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        v2Json({
          username: userName ?? "TakasumiBOT Global",
          avatar_url: config.image.botIcon,
          embeds: [
          {
            color: Colors.Green,
            title: title,
            thumbnail: {
              url: thumbnailUrl,
            },
            description: desc,
            footer: {
              text: [footerText, String(history.id)].join(" | "), //footerTextがない場合には線を入れないため
            },
            timestamp: new Date().toISOString(),
          },
          ],
        }),
      ),
    };

    let isResend = false;
    let retryCount = 0;
    do {
      if (isResend) retryCount++;
      if (retryCount > 3) {
        console.warn("[ERROR] globalchat retry is over 3. retry stop.");
        break;
      }
      isResend = false;
      await new Promise(async (resolve) => {
        let response: Response | null = null;
        try {
          response = await fetch(`${gcData.webhookUrl}?wait=true`, webhookdata);
        } catch (error) {
          console.error(error);
        }
        if (response === null) {
          isResend = true;
          setTimeout(() => {
            resolve(false);
          }, 750);
          return;
        }
        if (response.status === 200) {
          const msg: APIMessage = await response.json();
          await prisma.globalChatTransferHistory.create({
            data: {
              sourceId: history.id,
              guildId: gcData.guildId,
              channelId: gcData.channelId,
              messageId: msg.id,
            },
          });
        } else if (response.status === 404 || response.status === 401) {
          await prisma.globalChat.delete({
            where: {
              guildId: gcData.guildId,
            },
          });

          gcerror404(gcData.guildId);
        } else if (response.status === 429) {
          console.info(`globalchat message re-send (status 429)`);
          isResend = true;
          let retryAfter = Number(response.headers.get("X-RateLimit-Reset-After"));
          setTimeout(
            () => {
              resolve(false);
            },
            (retryAfter || 1) * 1000 + crypto.randomInt(400, 800),
          );
          return; //resolve再呼び出し防止
        } else if (response.status === 502 || response.status === 500 || response.status === 504) {
          console.info(`globalchat message re-send (status ${response.status})`);
          isResend = true;
          setTimeout(() => {
            resolve(false);
          }, 300);
        } else {
          console.warn(
            `globalchat webhook error: ${response.status}, ${(await response.text()).replace(/\r?\n/g, "")}`,
          );
        }
        resolve(true);
      });
    } while (isResend);
  });
}

export const gcerror404 = async function gcerror404(guildId: string) {
  setTimeout(async () => {
    return await sendGlobalChat({
      title: ":wave: グローバルチャットから1つのサーバーが離脱しました",
      desc: "**　**　　 　　／⌒ヽ\n⊂二二二（　＾ω＾）二⊃\n　　　　　|　　　 / 　　　　　　ﾌﾞｰﾝ\n　　 　　 （　ヽノ\n　　　　　 ﾉ>ノ\n　 三　　レﾚ",
      userName: "TakasumiBOT Global (System)",
      fromServerId: guildId,
      footerText: `(Guild ID: ${guildId})`,
    });
  }, 1000);
  //DB反映ラグと通信集中を避けるため、1秒の遅延を行う
};

export default sendGlobalChat;
