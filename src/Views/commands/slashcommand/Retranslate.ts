import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import translate from "@/Models/translate";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class RetranslateCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "fun";
  public readonly name: string = "retranslate";
  public readonly description: string = "様々な言語で翻訳を繰り返します";
  public readonly example: string[] = ["/retranslate こんにちは"];

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

    let text = interaction.options.getString("text", true);

    await interaction.deferReply();
    try {
      const langs = ["ja", "en", "es", "fr", "zh", "ru", "ko"];

      for (let i = 0; i < 50; i++) {
        text = (await translate(text, "auto", langs[i % 7])).text;
      }

      text = (await translate(text, "auto", "ja")).text;

      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "再翻訳しました",
              icon_url: config.image.successIcon,
            },
            description: text,
          },
        ],
      }));
    } catch {
      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "再翻訳できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "再翻訳文字を変えて、もう一度実行してください",
          },
        ],
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("text")
          .setDescription("再翻訳するテキスト")
          .setRequired(true)
          .setMaxLength(1000),
      );
  }
}

export default RetranslateCommand;
