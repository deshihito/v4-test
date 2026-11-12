import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";

class GuidelineEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isModalSubmit() || !interaction.customId.startsWith("guideline_")) return;

    const data = interaction.customId.split("_");
    const text = interaction.fields.getTextInputValue("text");

    if (!interaction.channel || interaction.channel.isDMBased())
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "作成できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "チャンネルが取得できないか、テキストチャンネルで実行してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      await interaction.channel.send({
        embeds: [
          {
            color: Colors.Green,
            title: "このサーバーのガイドライン",
            thumbnail: {
              url: config.image.guidelineIcon,
            },
            description: text,
          },
          {
            color: Colors.Green,
            description:
              "続行するにはこのサーバーのガイドラインを守る必要があります。\n[Discord コミュニティガイドライン](https://discord.com/guidelines) も忘れないようにして下さい。",
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`guide_${data[1]}`)
              .setStyle(ButtonStyle.Secondary)
              .setLabel("同意します"),
          ),
        ],
      });

      await interaction.deferUpdate({});
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "ガイドラインの作成に失敗しました",
              icon_url: config.image.errorIcon,
            },
            description: "BOTの権限等を確認し、もう一度実行してください",
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

export default GuidelineEvent;
