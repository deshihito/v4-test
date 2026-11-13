import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import config from "@/config";
import { reportTargetType } from "@/generated";
import Fetch from "@/Models/Fetch";
import createId from "@/util/createId";
import Mute from "@/Models/Mute";
import { findUserAddress, createTmpReport } from "@/Models/Report";
import { v2 } from "@/util/v2";

class ReportEvent implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "report";
  public readonly prefix = false;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ModalSubmitInteraction): Promise<InteractionResponse<boolean> | void> {

    const title = interaction.fields.getTextInputValue("title");
    const id = interaction.fields.getTextInputValue("id");
    const reason = interaction.fields.getTextInputValue("reason");

    const user = await Fetch.user(this.client, id);
    const guild = await Fetch.guild(this.client, id);

    if (!user && !guild)
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "通報できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "無効なユーザーID又はサーバーIDです",
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
        flags: MessageFlags.Ephemeral,
      }));

    try {
      const reportGuild = await Fetch.guild(this.client, config.report.guildId);

      if (!reportGuild)
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "通報できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "サポートサーバーの情報が取得できません",
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
          flags: MessageFlags.Ephemeral,
        }));

      const reportChannel = await Fetch.channel(reportGuild, config.report.channelId);

      if (!reportChannel || !reportChannel.isSendable())
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "通報できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "サポートサーバーのチャンネル情報が取得できません",
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
          flags: MessageFlags.Ephemeral,
        }));

      const reportId = createId(10);

      const components = [
        new ButtonBuilder()
          .setCustomId(`report_delete_${reportId}`)
          .setStyle(ButtonStyle.Success)
          .setLabel("棄却"),
        new ButtonBuilder()
          .setCustomId(`report_warn_${reportId}`)
          .setStyle(ButtonStyle.Danger)
          .setLabel("警告"),
      ];

      if (user) {
        if (user.bot)
          return await interaction.reply(v2({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "通報できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "BOTは通報できません",
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
            flags: MessageFlags.Ephemeral,
          }));

        if (await Mute.getUser(user.id)) {
          components.push(
            new ButtonBuilder()
              .setCustomId(`report_unMuteUser_${reportId}`)
              .setStyle(ButtonStyle.Danger)
              .setLabel("ミュートを解除"),
          );
        } else {
          components.push(
            new ButtonBuilder()
              .setCustomId(`report_muteUser_${reportId}`)
              .setStyle(ButtonStyle.Danger)
              .setLabel("ミュート"),
          );
        }

        const userAddressData = await findUserAddress(interaction.user.id);

        if (userAddressData) {
          if (await Mute.getIp(userAddressData.address)) {
            components.push(
              new ButtonBuilder()
                .setCustomId(`report_unMuteIp_${reportId}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("IPミュートを解除"),
            );
          } else {
            components.push(
              new ButtonBuilder()
                .setCustomId(`report_muteIp_${reportId}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("IPミュート"),
            );
          }
        }

        await createTmpReport({
          id: reportId,
          targetType: reportTargetType.user,
          targetId: user.id,
          title: title,
          reason: reason,
          reporterId: interaction.user.id,
        });

        await reportChannel.send(v2({
          embeds: [
            {
              color: Colors.Green,
              title: title,
              description: `**通報ID**: \`${reportId}\`\n\n**ユーザー**: ${user.displayName}(${user.id})\n\n${reason}`,
              footer: {
                text: `${interaction.user.displayName}(${interaction.user.id})`,
                icon_url:
                  interaction.user.avatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png",
              },
            },
          ],
          components: [new ActionRowBuilder<ButtonBuilder>().addComponents(...components)],
        }));
      } else if (guild) {
        if (await Mute.getGuild(guild.id)) {
          components.push(
            new ButtonBuilder()
              .setCustomId(`report_unMuteGuild_${reportId}`)
              .setStyle(ButtonStyle.Danger)
              .setLabel("ミュートを解除"),
          );
        } else {
          components.push(
            new ButtonBuilder()
              .setCustomId(`report_muteGuild_${reportId}`)
              .setStyle(ButtonStyle.Danger)
              .setLabel("ミュート"),
          );
        }

        await createTmpReport({
          id: reportId,
          targetType: reportTargetType.guild,
          targetId: guild.id,
          title: title,
          reason: reason,
          reporterId: interaction.user.id,
        });

        await reportChannel.send(v2({
          embeds: [
            {
              color: Colors.Green,
              title: title,
              description: `**通報ID**: \`${reportId}\`\n\n**サーバー**: ${guild.name}(${guild.id})\n\n${reason}`,
              footer: {
                text: `${interaction.user.displayName}(${interaction.user.id})`,
                icon_url:
                  interaction.user.avatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png",
              },
            },
          ],
          components: [new ActionRowBuilder<ButtonBuilder>().addComponents(...components)],
        }));
      }

      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "通報しました",
              icon_url: config.image.successIcon,
            },
            fields: [
              {
                name: "通報ID",
                value: reportId,
              },
              {
                name: "用件",
                value: title,
              },
              {
                name: "対象",
                value: user
                  ? `${user.displayName}(${user.id})`
                  : guild
                    ? `${guild.name}(${guild.id})`
                    : "取得できませんでした",
              },
              {
                name: "理由",
                value: reason,
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
        flags: MessageFlags.Ephemeral,
      }));
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "通報できませんでした",
              icon_url: config.image.errorIcon,
            },
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
        flags: MessageFlags.Ephemeral,
      }));
    }
  }
}

export default ReportEvent;
