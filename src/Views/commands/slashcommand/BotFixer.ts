import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import BotFixerBase, { defaultUiState } from "@/Controllers/components/BotFixerBase";

class BotFixerCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "setting";
  public readonly name: string = "bot_fixer";
  public readonly description: string = "コマンドと他ボットの制限を設定します";
  public readonly example: string[] = ["/bot_fixer"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageGuild];

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

    const panel = await new PanelBuilder().buildPanel(
      this.client,
      interaction.guildId,
      defaultUiState(),
    );

    await interaction.reply({
      components: [panel],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

class PanelBuilder extends BotFixerBase {}

export default BotFixerCommand;
