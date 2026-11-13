import {
  Client,
  Message,
  Colors,
  ChannelType,
  WebhookClient,
  APIMessage,
  APIEmbed,
} from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import config from "@/config";
import isAdmin from "@/Models/isAdmin";
import parseMessage from "@/util/parseMessage";
import Fetch from "@/Models/Fetch";
import {
  findGlobalChatByChannelId,
  listGlobalChats,
  createGlobalChatHistory,
  createGlobalChatTransferHistory,
  deleteGlobalChatByGuildId,
} from "@/Models/GlobalChat";
import Mute from "@/Models/Mute";
import crypto from "node:crypto";
import { gcerror404 } from "@/Models/sendGlobalChat";
import { extractV2Text, v2Json } from "@/util/v2";

class GlobalChatEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (
      message.author.bot ||
      !message.inGuild() ||
      message.channel.type !== ChannelType.GuildText
    )
      return;

    const isAdm = await isAdmin(message.author.id);
    if (message.content.length > (isAdm ? 1500 : 300)) return;

    const guildGlobalChatData = await findGlobalChatByChannelId(message.channel.id);

    if (!guildGlobalChatData) return;

    const history = await createGlobalChatHistory({
      userId: message.author.id,
      guildId: message.guildId,
      channelId: message.channel.id,
      messageId: message.id,
    });

    const embeds: APIEmbed[] = [
      {
        color: Math.floor(Math.random() * (0xffffff + 1)),
        author: {
          name: isAdm ? `${message.author.tag}(管理者)` : `${message.author.tag}`,
          url: `https://discord.com/users/${message.author.id}`,
          icon_url: message.author.avatarURL() || message.author.defaultAvatarURL,
        },
        footer: {
          text: `${message.guild.name}(${message.guild.id}) | ${history.id}`,
          icon_url: message.guild.iconURL() || "https://cdn.discordapp.com/embed/avatars/0.png",
        },
        timestamp: new Date().toISOString(),
      },
    ];

    if (message.content.length > 0) {
      embeds[0].description = parseMessage(message.content);
    }

    if (message.reference?.messageId) {
      const replyWebhook = new WebhookClient({ url: guildGlobalChatData.webhookUrl });
      const replyWebhookMessage = await Fetch.webhookMessage(
        replyWebhook,
        message.reference.messageId,
      );

      if (replyWebhookMessage) {
        const quoted = extractV2Text(replyWebhookMessage);
        embeds[0].fields = [
          {
            name: "\u200b",
            value: `**${quoted.author || "不明"}>>** ${quoted.description || "なし"}`,
          },
        ];
      } else {
        const replyMessage = await Fetch.message(message.channel, message.reference.messageId);

        if (replyMessage) {
          if (await Mute.getUser(replyMessage.author.id)) {
            embeds[0].fields = [
              {
                name: "\u200b",
                value: "-# **BANされたユーザー**>> 表示できません",
              },
            ];
          } else {
            embeds[0].fields = [
              {
                name: "\u200b",
                value: `**${replyMessage.author.tag}>>** ${parseMessage(replyMessage.content.slice(0, 150) || "なし")}`,
              },
            ];
          }
        }
      }
    }

    const attachment = message.attachments.first();
    if (attachment) {
      if (attachment.height && attachment.width) {
        embeds.push({
          color: Colors.Green,
          title: attachment.name ?? undefined,
          description: `[ファイルを開く](${attachment.url})`,
          image: { url: attachment.url },
        });
      } else {
        embeds.push({
          color: Colors.Green,
          title: attachment.name ?? undefined,
          description: `[ファイルを開く](${attachment.url})`,
        });
      }
    }

    const globalChatData = await listGlobalChats();

    globalChatData.forEach(async (gcData) => {
      if (gcData.guildId === message.guild.id) return;

      const webhookdata = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          v2Json({
            username: "TakasumiBOT Global",
            avatar_url: config.image.botIcon,
            embeds: embeds,
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

            await createGlobalChatTransferHistory({
              sourceId: history.id,
              guildId: gcData.guildId,
              channelId: gcData.channelId,
              messageId: msg.id,
            });
          } else if (response.status === 404 || response.status === 401) {
            await deleteGlobalChatByGuildId(gcData.guildId);
            void gcerror404(gcData.guildId);
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
          } else if (
            response.status === 502 ||
            response.status === 500 ||
            response.status === 504
          ) {
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

    await message.react("✅").catch(() => {});
  }
}

export default GlobalChatEvent;
