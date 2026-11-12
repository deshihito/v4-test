import {
  Client,
  PermissionFlagsBits,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class SlowmodeCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "slowmode";
  public readonly description: string = "チャンネルに低速モードを設定します";
  public readonly example: string[] = ["/slowmode 10"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageChannels];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.ManageChannels];

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

    const time: number = interaction.options.getInteger("time", true);

    try {
      await interaction.channel.setRateLimitPerUser(time);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "低速モードを設定しました",
              icon_url: config.image.successIcon,
            },
            description: `低速モードは現在${time}秒です`,
          },
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "低速モードが設定できませんでした",
              icon_url: config.image.errorIcon,
            },
            fields: [
              {
                name: "エラーコード",
                value: `\`\`\`${error}\`\`\``,
              },
            ],
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("サポートサーバー")
              .setURL(config.inviteUrl)
              .setStyle(ButtonStyle.Link),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option
          .setName("time")
          .setDescription("設定する秒数")
          .setMaxValue(21599)
          .setMinValue(1)
          .setRequired(true),
      );
  }
}

export default SlowmodeCommand;
