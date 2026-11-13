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
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class NumberCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "fun";
  public readonly name: string = "number";
  public readonly description: string = "進数の変換をします";
  public readonly example: string[] = ["/number 10進数 2進数 120"];

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

    const source: string = interaction.options.getString("source", true);
    const target: string = interaction.options.getString("target", true);
    const number: string = interaction.options.getString("number", true);

    const data: string = parseInt(number, Number(source)).toString(Number(target));

    await interaction.reply(v2({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: `${source}進数から${target}進数に変換しました`,
            icon_url: config.image.successIcon,
          },
          description: `\`\`\`${data}\`\`\``,
        },
      ],
    }));
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("source")
          .setDescription("変換元の進数")
          .setRequired(true)
          .addChoices(
            { name: "2進数", value: "2" },
            { name: "8進数", value: "8" },
            { name: "10進数", value: "10" },
            { name: "16進数", value: "16" },
          ),
      )
      .addStringOption((option) =>
        option
          .setName("target")
          .setDescription("変換先の進数")
          .setRequired(true)
          .addChoices(
            { name: "2進数", value: "2" },
            { name: "8進数", value: "8" },
            { name: "10進数", value: "10" },
            { name: "16進数", value: "16" },
          ),
      )
      .addStringOption((option) =>
        option.setName("number").setDescription("変換する数値").setRequired(true),
      );
  }
}

export default NumberCommand;
