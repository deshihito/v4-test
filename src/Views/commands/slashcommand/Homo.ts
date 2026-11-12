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
import CommandUtils from "@/Controllers/CommandUtils";
import homo from "@/util/homo";

class HomoCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "fun";
  public readonly name: string = "homo";
  public readonly description: string = "数値をある法則に従って変換します";
  public readonly example: string[] = ["/homo 3141592"];

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

    const number: string = interaction.options.getString("number", true);

    if (isNaN(Number(number)))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "変換できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "数字を半角で入力する必要があります",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const result: string = homo(Number(number));

    await interaction.reply({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: "変換しました",
            icon_url: config.image.successIcon,
          },
          description: `\`\`\`${result}\`\`\``,
        },
      ],
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("number").setDescription("変換する数字").setRequired(true).setMaxLength(30),
      );
  }
}

export default HomoCommand;
