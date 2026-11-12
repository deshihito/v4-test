import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  InteractionResponse,
  SlashCommandSubcommandsOnlyBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Command, CommandType, SubCommand } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";

class SettingCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "othor";
  public readonly name: string = "setting";
  public readonly description: string = "サーバーの設定を変更します";
  public readonly example: string[] = [];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.Administrator];

  public readonly botPermission: bigint[] = [];

  public readonly isDisplay: boolean = true;

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

export default SettingCommand;
