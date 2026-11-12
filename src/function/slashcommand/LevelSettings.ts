import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/util/CommandUtils";
import { prisma } from "@/util/db";

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
    const notify: boolean = setting?.notify ?? true;

    await interaction.reply({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: "レベル設定",
            icon_url: config.image.configIcon,
          },
          description: `レベルアップ通知: **${notify ? "オン" : "オフ"}**`,
        },
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`levelSettings_${interaction.user.id}`)
            .setLabel(notify ? "レベルアップ通知をオフにする" : "レベルアップ通知をオンにする")
            .setStyle(notify ? ButtonStyle.Danger : ButtonStyle.Success),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default LevelSettingsCommand;
