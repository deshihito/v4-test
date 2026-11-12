import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  MessageFlags,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";

class ResetEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isButton() || !interaction.customId.startsWith("reset_")) return;

    const data = interaction.customId.split("_");

    if (data[1] !== interaction.user.id)
      return await interaction.reply({
        embeds: [
          {
            author: {
              name: "リセットできませんでした",
              icon_url: config.image.errorIcon,
            },
            color: Colors.Red,
            description: "このコマンドは別の人が実行しています",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (!interaction.channel || interaction.channel.isDMBased() || interaction.channel.isThread())
      return await interaction.reply({
        embeds: [
          {
            author: {
              name: "リセットできませんでした",
              icon_url: config.image.errorIcon,
            },
            color: Colors.Red,
            description: "チャンネルが取得できません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      const channel = await interaction.channel.clone();
      await channel.setPosition(interaction.channel.position + 1);
      await interaction.channel.delete();

      await interaction.deferUpdate({});
      await channel
        .send({
          content: `<@${interaction.user.id}>`,
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "チャンネルをリセットしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        })
        .catch(() => {});
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "チャンネルをリセットできませんでした",
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
      });
    }
  }
}

export default ResetEvent;
