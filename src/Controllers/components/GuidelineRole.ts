import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  GuildMemberRoleManager,
  ButtonInteraction,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import config from "@/config";
import { v2 } from "@/util/v2";

class GuidelineRoleEvent implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "guide_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ButtonInteraction): Promise<InteractionResponse<boolean> | void> {

    const data = interaction.customId.split("_");

    if (!(interaction.member?.roles instanceof GuildMemberRoleManager))
      return await interaction.reply(v2({
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
      }));

    if (interaction.member.roles.cache.has(data[1]))
      return await interaction.reply(v2({
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
      }));

    try {
      await interaction.member.roles.add(data[1]);

      await interaction.reply(v2({
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
      }));
    } catch (error) {
      await interaction.reply(v2({
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
      }));
    }
  }
}

export default GuidelineRoleEvent;
