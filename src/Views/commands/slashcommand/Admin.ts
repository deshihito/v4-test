import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  InteractionResponse,
  Colors,
  MessageFlags,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { Command, CommandType, SubCommand } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import isAdmin from "@/Models/isAdmin";

class AdminCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "othor";
  public readonly name: string = "admin";
  public readonly description: string = "管理者専用";
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

    if (!(await isAdmin(interaction.user.id)))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "このコマンドは実行できません",
              icon_url: config.image.errorIcon,
            },
            description: "このコマンドは**TakasumiBOT 管理者**専用です\n一般のユーザーは実行することができません\nこのエラーについてはサポートサーバーで対応することができません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

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

export default AdminCommand;
