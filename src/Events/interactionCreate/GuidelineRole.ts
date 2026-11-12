import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  GuildMemberRoleManager,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";

class GuidelineRoleEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isButton() || !interaction.customId.startsWith("guide_")) return;

    const data = interaction.customId.split("_");

    if (!(interaction.member?.roles instanceof GuildMemberRoleManager))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "同意に失敗しました",
              icon_url: config.image.errorIcon,
            },
            description: "メンバーが取得できません",
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
              name: "既に同意済みです",
              icon_url: config.image.errorIcon,
            },
            description: "このサーバーのガイドラインに既に同意しているようです",
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
              name: "同意しました",
              icon_url: config.image.successIcon,
            },
            description:
              "このサーバーのガイドラインに同意しました\nこれでロールが付与され、晴れてサーバーの一員となりました",
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
              name: "同意に失敗しました",
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

export default GuidelineRoleEvent;
