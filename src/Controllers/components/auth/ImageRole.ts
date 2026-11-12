import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  GuildMemberRoleManager,
  ButtonStyle,
  ButtonBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { SelectController } from "@/@types/Util";
import config from "@/config";
class ImageRoleAuthEvent implements SelectController {
  public readonly client: Client;
  public readonly kind = "select" as const;
  public readonly customId = "imagerole_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: StringSelectMenuInteraction): Promise<InteractionResponse<boolean> | void> {

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
