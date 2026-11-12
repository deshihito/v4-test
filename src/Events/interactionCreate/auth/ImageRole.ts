import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  GuildMemberRoleManager,
  ButtonStyle,
  ButtonBuilder,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";
class ImageRoleAuthEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isStringSelectMenu() || !interaction.customId.startsWith("imagerole_")) return;

    const data = interaction.customId.split("_");
    const key = interaction.values[0];

    if (!interaction.member || !(interaction.member.roles instanceof GuildMemberRoleManager))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "ロールが取得できませんでした",
              icon_url: config.image.errorIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (interaction.member.roles.cache.has(data[1]))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "既に認証済みです",
              icon_url: config.image.errorIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (key !== data[2])
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "選択した値が間違っています",
              icon_url: config.image.errorIcon,
            },
            description: "画像に表示される文字を選択してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      await interaction.member.roles.add(data[1]);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "認証しました",
              icon_url: config.image.successIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "認証に失敗しました",
              icon_url: config.image.errorIcon,
            },
            description: "BOTの権限が不足しているか、付与するロールがBOTより上の可能性があります",
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
      });
    }
  }
}

export default ImageRoleAuthEvent;
