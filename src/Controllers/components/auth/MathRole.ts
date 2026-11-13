import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  GuildMemberRoleManager,
  ButtonStyle,
  ButtonBuilder,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import config from "@/config";
import { v2 } from "@/util/v2";

class MathRoleAuthEvent implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "mathrole_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ModalSubmitInteraction): Promise<InteractionResponse<boolean> | void> {

    const data = interaction.customId.split("_");
    const code = interaction.fields.getTextInputValue("code");

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

    if (isNaN(Number(code)))
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "認証コードが間違っています",
              icon_url: config.image.errorIcon,
            },
            description: "答えの数字を半角で入力してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    if (code !== data[2])
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "入力コードが間違っています",
              icon_url: config.image.errorIcon,
            },
            description: "認証時に表示される画面に書かれている通りに認証してください",
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

export default MathRoleAuthEvent;
