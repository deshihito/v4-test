import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import iconv from "iconv-lite";
import CommandUtils from "@/Controllers/CommandUtils";

class CharCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "fun";
  public readonly name: string = "char";
  public readonly description: string = "意図的に文字化や復元をします";
  public readonly example: string[] = ["/char 文字化け moji", "/char 復元 阿懿燠ヱ淤"];

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

    const type = interaction.options.getString("type", true);
    const text = interaction.options.getString("text", true);

    try {
      if (type === "encode") {
        const buffer = iconv.encode(text, "UTF-8");

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "エンコードしました",
                icon_url: config.image.successIcon,
              },
              description: `\`\`\`${iconv.decode(buffer, "Shift_JIS")}\`\`\``,
            },
          ],
        });
      } else {
        const buffer = iconv.encode(text, "Shift_JIS");

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "デコードしました",
                icon_url: config.image.successIcon,
              },
              description: `\`\`\`${iconv.decode(buffer, "UTF-8")}\`\`\``,
            },
          ],
        });
      }
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "変換できませんでした",
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
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("処理方式")
          .setRequired(true)
          .addChoices({ name: "文字化け", value: "encode" }, { name: "復元", value: "decode" }),
      )
      .addStringOption((option) =>
        option.setName("text").setDescription("処理するテキスト").setRequired(true),
      );
  }
}

export default CharCommand;
