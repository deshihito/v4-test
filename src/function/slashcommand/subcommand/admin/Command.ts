import {
  Client,
  InteractionResponse,
  Colors,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/util/CommandUtils";
import config from "@/config";
import commands from "@/static/commands.json";
import { prisma } from "@/Models/db";

class CommandSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "command";
  public readonly description: string = "コマンドを有効化/無効化します";
  public readonly example: string[] = [];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: ValidSubCommandInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      interaction.options.getSubcommand() !== this.name ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const name: string = interaction.options.getString("name", true);

    if (!commands.find((command) => command.name === name))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "操作できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "存在しないコマンドです",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const commandData = await prisma.disableCommand.findFirst({
      where: {
        name: name,
      },
    });

    if (commandData) {
      await prisma.disableCommand.delete({
        where: {
          name: name,
        },
      });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `/${name}を有効にしました`,
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } else {
      await prisma.disableCommand.create({
        data: {
          name: name,
        },
      });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `/${name}を無効にしました`,
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    }
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("name").setDescription("対象のコマンド名").setRequired(true),
      );
  }
}

export default CommandSubCommand;
