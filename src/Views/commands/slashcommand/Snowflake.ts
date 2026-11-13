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
  SnowflakeUtil,
  DeconstructedSnowflake,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class SnowflakeCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "othor";
  public readonly name: string = "snowflake";
  public readonly description: string = "Snowflakeを解析します";
  public readonly example: string[] = ["/snowflake 9876919198104435"];

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

    const id: string = interaction.options.getString("id", true);

    if (isNaN(Number(id)))
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "解析できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "Snowflakeは数字で指定する必要があります",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    try {
      const snowflake: DeconstructedSnowflake = SnowflakeUtil.deconstruct(id);

      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "解析しました",
              icon_url: config.image.successIcon,
            },
            description: `Date: ${new Date(Number(snowflake.timestamp)).toLocaleString("ja-JP")}\nWorkerID: ${snowflake.workerId}\nProcessID: ${snowflake.processId}\nIncrement: ${snowflake.increment}`,
          },
        ],
      }));
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "解析できませんでした",
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
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("id").setDescription("解析するID").setRequired(true),
      );
  }
}

export default SnowflakeCommand;
