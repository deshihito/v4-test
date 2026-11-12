import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  InteractionResponse,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { Command, CommandType, SubCommand } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";

class OptoutCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "setting";
  public readonly name: string = "optout";
  public readonly description: string = "オプトアウト、オプトインします。";
  public readonly example: string[] = [];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  public readonly isDisplay: boolean = false;

  public subcommands: SubCommand[] = [];

  constructor(client: Client) {
    this.client = client;

    CommandUtils.loadSubCommand(this.client, this.name).then((subcommands) => {
      this.subcommands = subcommands;
    });
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

    Promise.all(this.subcommands.map((command) => command.execute(interaction)));
  }

  public build(): SlashCommandSubcommandsOnlyBuilder {
    const command = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

    this.subcommands.forEach((subcommand) => {
      command.addSubcommand(subcommand.build());
    });

    return command;
  }
}

export default OptoutCommand;
