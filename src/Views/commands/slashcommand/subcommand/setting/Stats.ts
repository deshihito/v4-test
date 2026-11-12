import { Client, InteractionResponse, Colors, SlashCommandSubcommandBuilder } from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import {
  createGuildStatistics,
  deleteGuildStatistics,
  findGuildStatistics,
} from "@/Models/GuildStatistics";

class JoinSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "stats";
  public readonly description: string = "サーバーの統計の収集を有効化、無効化します";
  public readonly example: string[] = ["/setting stats"];
  public readonly note: string =
    "統計情報は/serverで確認できます\n統計情報は1日おきにリセットされます";

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

    const guildStatisticsData = await findGuildStatistics(interaction.guildId);

    if (!guildStatisticsData) {
      await createGuildStatistics(interaction.guildId);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "統計情報の収集を有効にしました",
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } else {
      await deleteGuildStatistics(interaction.guildId);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "統計情報の収集を無効にしました",
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    }
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default JoinSubCommand;
