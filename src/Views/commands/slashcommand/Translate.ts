import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import translate from "@/Models/translate";
import CommandUtils from "@/Controllers/CommandUtils";

class TranslateCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "translate";
  public readonly description: string = "テキストを翻訳します";
  public readonly example: string[] = ["/translate hello 日本語"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const text: string = interaction.options.getString("text", true);
    const lang: string = interaction.options.getString("lang", true);

    try {
      const data = await translate(text, "auto", lang);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Blue,
            title: "翻訳結果",
            description: data.text,
            footer: {
              text: `Google翻訳 [${data.source}]->[${lang}]`,
              icon_url: config.image.translateIcon,
            },
          },
        ],
      });
    } catch {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "翻訳できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "文字を変えて、もう一度実行してください",
            footer: {
              text: "Google翻訳",
              icon_url: config.image.translateIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("text")
          .setDescription("翻訳するテキスト")
          .setMaxLength(1000)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("lang")
          .setDescription("翻訳先の言語")
          .setRequired(true)
          .addChoices(
            { name: "日本語", value: "ja" },
            { name: "英語", value: "en" },
            { name: "韓国語", value: "ko" },
            { name: "中国語", value: "zh" },
            { name: "ロシア語", value: "ru" },
            { name: "フランス語", value: "fr" },
            { name: "ドイツ語", value: "de" },
          ),
      );
  }
}

export default TranslateCommand;
