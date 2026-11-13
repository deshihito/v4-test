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
import { findBinjouSetting, listBinjouRules } from "@/Models/Binjou";
import { buildBinjouPanel } from "@/Views/binjouPanel";

class BinjouReactCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "setting";
  public readonly name: string = "binjou_react";
  public readonly description: string = "絵文字便乗を設定します";
  public readonly example: string[] = ["/binjou_react"];

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

    const [settings, rules] = await Promise.all([
      findBinjouSetting(interaction.guildId),
      listBinjouRules(interaction.guildId),
    ]);

    await interaction.reply({
      components: [buildBinjouPanel(settings, rules)],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default BinjouReactCommand;
