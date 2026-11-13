import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  PermissionFlagsBits,
  ButtonStyle,
  ButtonBuilder,
  ButtonInteraction,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import config from "@/config";
import { v2 } from "@/util/v2";

class TicketEvent implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "ticket_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ButtonInteraction): Promise<InteractionResponse<boolean> | void> {

    const data = interaction.customId.split("_");

    if (!interaction.guild)
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "作成できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "サーバーが取得できません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    if (
      interaction.guild.channels.cache.find(
        (channel) => channel.parentId === data[1] && channel.name === interaction.user.id,
      )
    )
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "作成できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "既にチケットが作成済みです",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    const channel = interaction.guild.channels.cache.find((name) => name.id === data[1]);
    if (!channel)
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "作成できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "設定されたカテゴリーが存在していません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    try {
      const ch = await interaction.guild.channels.create({
        name: interaction.user.id,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
        parent: channel.id,
      });

      await ch.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true,
      });

      await ch.send(v2({
        content: `<@${interaction.user.id}>`,
        embeds: [
          {
            color: Colors.Green,
            title: "チケットへようこそ",
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("close")
              .setStyle(ButtonStyle.Danger)
              .setLabel("閉じる"),
          ),
        ],
      }));

      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `チケットを作成しました`,
              icon_url: config.image.successIcon,
            },
            description: `<#${ch.id}>`,
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "作成できませんでした",
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

export default TicketEvent;
