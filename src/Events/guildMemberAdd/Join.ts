import {
  Client,
  Colors,
  ButtonStyle,
  WebhookClient,
  ActionRowBuilder,
  ButtonBuilder,
  GuildMember,
} from "discord.js";
import { GuildMemberAddEvent } from "@/@types/Util";
import { deleteJoinNotice, findJoinNotice } from "@/Models/BoardNotice";
import config from "@/config";
import Fetch from "@/Models/Fetch";
import { v2 } from "@/util/v2";

class JoinEvent implements GuildMemberAddEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(member: GuildMember): Promise<void> {
    const noticeData = await findJoinNotice(member.guild.id);

    if (!noticeData) return;

    const message = noticeData.message
      .replace(/\[User\]/g, `<@${member.user.id}>`)
      .replace(/\[UserName\]/g, `${member.user.tag}`)
      .replace(/\[UserDisplayName\]/g, `${member.user.displayName}`)
      .replace(/\[UserID\]/g, `${member.user.id}`)
      .replace(/\[ServerName\]/g, `${member.guild.name}`)
      .replace(/\[ServerID\]/g, `${member.guild.id}`)
      .replace(/\[Count\]/g, `${member.guild.memberCount}`);

    try {
      const webhook = new WebhookClient({ url: noticeData.webhookUrl });

      await webhook.send({
        content: message,
        username: "TakasumiBOT",
        avatarURL: config.image.botIcon,
      });
    } catch (error) {
      await deleteJoinNotice(noticeData.guildId);

      const channel = await Fetch.channel(member.guild, noticeData.channelId);

      if (!channel || !channel.isTextBased()) return;

      try {
        await channel.send(v2({
          embeds: [
            {
              author: {
                name: "参加メッセージでエラーが発生しました",
                icon_url: config.image.errorIcon,
              },
              color: Colors.Red,
              description: "エラーが発生したため、強制的に無効にされました",
              fields: [
                {
                  name: "エラーコード",
                  value: `\`\`\`${error}\`\`\``,
                },
              ],
            },
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("サポートサーバー")
                .setURL(config.inviteUrl)
                .setStyle(ButtonStyle.Link),
            ),
          ],
        }));
      } catch {
        return;
      }
    }
  }
}

export default JoinEvent;
