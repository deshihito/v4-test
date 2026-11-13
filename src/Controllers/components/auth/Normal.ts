import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  GuildMemberRoleManager,
  ButtonStyle,
  ButtonBuilder,
  ButtonInteraction,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import config from "@/config";
import { v2 } from "@/util/v2";
class NormalAuthEvent implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "normal_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ButtonInteraction): Promise<InteractionResponse<boolean> | void> {

    const data = interaction.customId.split("_");

    if (!interaction.member || !(interaction.member.roles instanceof GuildMemberRoleManager))
      return await interaction.reply(v2({
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
      }));

    if (interaction.member.roles.cache.has(data[1]))
      return await interaction.reply(v2({
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
      }));

    try {
      await interaction.member.roles.add(data[1]);

      await interaction.reply(v2({
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
      }));
    } catch (error) {
      await interaction.reply(v2({
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
      }));
    }
  }
}

export default NormalAuthEvent;
