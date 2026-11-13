import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Guild,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import Report from "@/util/Report";
import { relative } from "path";
import { v2 } from "@/util/v2";

class ResetCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "reset";
  public readonly description: string = "実行したチャンネルを完全にリセットします";
  public readonly example: string[] = ["/reset"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.Administrator];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
  ];

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

    await interaction.reply(v2({
      embeds: [
        {
          color: Colors.Yellow,
          author: {
            name: "本当にこのチャンネルをリセットしますか？",
            icon_url: config.image.warnIcon,
          },
        },
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("リセットする")
            .setCustomId(`reset_${interaction.user.id}`)
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    }));
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default ResetCommand;
