import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  AttachmentBuilder,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { GifResponse } from "@/@types/Api";
import { env } from "@/util/Env";
import { v2 } from "@/util/v2";

class GifCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "search";
  public readonly name: string = "gif";
  public readonly description: string = "GIF画像を検索して表示します";
  public readonly example: string[] = ["/gif Apple"];

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

    const name: string = interaction.options.getString("name", true);

    await interaction.deferReply();
    try {
      const data: GifResponse = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${name}&locale=ja&key=${env.GIF_KEY}&limit=1&media_filter=minimal&contentfilter=medium`,
      ).then((res) => res.json());

      const image: ArrayBuffer = await fetch(data.results[0].media_formats.gif.url).then((res) =>
        res.arrayBuffer(),
      );

      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "GIFを取得しました",
              icon_url: config.image.successIcon,
            },
            image: {
              url: "attachment://result.gif",
            },
          },
        ],
        files: [new AttachmentBuilder(Buffer.from(image)).setName("result.gif")],
      }));
    } catch {
      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "違うワードで試してください",
          },
        ],
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("name").setDescription("検索名").setRequired(true),
      );
  }
}

export default GifCommand;
