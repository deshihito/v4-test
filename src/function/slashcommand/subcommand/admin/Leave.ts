import {
  Client,
  InteractionResponse,
  Colors,
  Guild,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/util/CommandUtils";
import config from "@/config";
import Fetch from "@/Models/Fetch";

class LeaveSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "leave";
  public readonly description: string = "指定したサーバーから脱退します";
  public readonly example: string[] = [];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: ValidSubCommandInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      interaction.options.getSubcommand() !== this.name ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const id = interaction.options.getString("id", true);

    const guild: Guild | null = await Fetch.guild(interaction.client, id);
    if (!guild)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "サーバーから脱退できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定したサーバーが存在しません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      await guild.leave();

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${guild.name}(${guild.id}) から脱退しました`,
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "サーバーから脱退できませんでした",
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
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("id").setDescription("サーバーID").setRequired(true),
      );
  }
}

export default LeaveSubCommand;
