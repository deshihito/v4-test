import {
  Client,
  Colors,
  InteractionResponse,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  GuildMemberRoleManager,
  StringSelectMenuInteraction,
} from "discord.js";
import { SelectController } from "@/@types/Util";
import config from "@/config";
import sleep from "@/util/sleep";

class PanelEvent implements SelectController {
  public readonly client: Client;
  public readonly kind = "select" as const;
  public readonly customId = "role";
  public readonly prefix = false;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: StringSelectMenuInteraction): Promise<InteractionResponse<boolean> | void> {

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const add = interaction.values.filter(
        (role) =>
          interaction.member?.roles instanceof GuildMemberRoleManager &&
          !interaction.member.roles.cache.has(role),
      );
      const remove = interaction.values.filter((role) => !add.includes(role));

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            description: "ロールを変更中...",
          },
        ],
      });

      await Promise.all(
        add.map(async (role) => {
          if (!interaction.member || !(interaction.member.roles instanceof GuildMemberRoleManager))
            return;

          await sleep(500);

          await interaction.member.roles.add(role).catch(() => {});
        }),
      );

      await Promise.all(
        remove.map(async (role) => {
          if (!interaction.member || !(interaction.member.roles instanceof GuildMemberRoleManager))
            return;

          await sleep(500);

          await interaction.member.roles.remove(role).catch(() => {});
        }),
      );

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "ロールを変更しました",
              icon_url: config.image.successIcon,
            },
            fields: [
              {
                name: "付与したロール",
                value: add.map((role) => `<@&${role}>`).join("\n") || "なし",
              },
              {
                name: "削除したロール",
                value: remove.map((role) => `<@&${role}>`).join("\n") || "なし",
              },
            ],
          },
        ],
      });
    } catch (error) {
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "ロールの変更に失敗しました",
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
      });
    }
  }
}

export default PanelEvent;
