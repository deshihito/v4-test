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
import { findHoneypotSetting } from "@/Models/Honeypot";
import { buildHoneypotPanel } from "@/Views/honeypotPanel";

class HoneypotCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "setting";
  public readonly name: string = "honeypot";
  public readonly description: string = "ハニーポットを設定します";
  public readonly example: string[] = ["/honeypot"];

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

    const settings = await findHoneypotSetting(interaction.guildId);

    await interaction.reply({
      components: [buildHoneypotPanel(settings)],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default HoneypotCommand;
