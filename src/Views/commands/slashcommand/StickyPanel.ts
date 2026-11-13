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
import { findStickySetting } from "@/Models/Sticky";
import { buildStickyPanel } from "@/Views/stickyPanel";

class StickyPanelCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "setting";
  public readonly name: string = "sticky_panel";
  public readonly description: string = "Stickyパネルを設定します";
  public readonly example: string[] = ["/sticky_panel"];

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

    const settings = await findStickySetting(interaction.guildId);

    await interaction.reply({
      components: [buildStickyPanel(settings)],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default StickyPanelCommand;
