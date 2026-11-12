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
import { prisma } from "@/Models/db";
import {
  buildLevelSettingsPanel,
  DEFAULT_LEVEL_SETTINGS,
} from "@/Views/commands/levelSettingsPanel";

class LevelSettingsCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "setting";
  public readonly name: string = "level_settings";
  public readonly description: string = "レベルの設定を変更します";
  public readonly example: string[] = ["/level_settings"];

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

    const setting = await prisma.levelSetting.findUnique({
      where: { userId: interaction.user.id },
    });

    // サーバー管理者には、ギルドの通知チャンネル設定も表示する
    let guild: { notifyChannelId: string | null } | undefined;
    if (
      interaction.inGuild() &&
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      const guildSetting = await prisma.levelGuildSetting.findUnique({
        where: { guildId: interaction.guildId },
      });
      guild = { notifyChannelId: guildSetting?.notifyChannelId ?? null };
    }

    await interaction.reply({
      components: [
        buildLevelSettingsPanel(
          interaction.user.id,
          {
            notify: setting?.notify ?? DEFAULT_LEVEL_SETTINGS.notify,
            mention: setting?.mention ?? DEFAULT_LEVEL_SETTINGS.mention,
            card: setting?.card ?? DEFAULT_LEVEL_SETTINGS.card,
          },
          guild,
        ),
      ],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default LevelSettingsCommand;
