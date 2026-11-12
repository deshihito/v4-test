import {
  Client,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  RepliableInteraction,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { WikiResponse } from "@/@types/Api";

class WikiCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "search";
  public readonly name: string = "wiki";
  public readonly description: string = "Wikipediaで検索し表示します";
  public readonly example: string[] = ["/wiki Discord"];

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

    const word: string = interaction.options.getString("word", true);

    try {
      const data: WikiResponse = await fetch(
        `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`,
      ).then((res) => res.json());

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            title: data.titles.normalized,
            url: `https://ja.wikipedia.org/wiki/${word}`,
            description: data.extract,
          },
        ],
      });
    } catch {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "検索ワードを変えて、もう一度実行してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("word").setDescription("検索ワード").setRequired(true),
      );
  }
}

export default WikiCommand;
