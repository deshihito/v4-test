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
import { v2 } from "@/util/v2";

class GraphCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "graph";
  public readonly description: string = "数式からグラフを生成します";
  public readonly note: string =
    "利用可能な文字・関数: 1234567890+-*/()^、pi、e、sqrt、log、abs、sin、cos、tan、x";
  public readonly example: string[] = ["/graph 2*x", "/graph x^3 -10 10"];

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

    const formula = interaction.options.getString("formula", true);
    const from = interaction.options.getInteger("from") || -100;
    const to = interaction.options.getInteger("to") || 100;

    await interaction.deferReply();
    try {
      const image = await fetch(
        `http://www.rurihabachi.com/web/webapi/functionxgraph/graph?fx=${encodeURIComponent(formula)}&xfrom=${from}&xto=${to}`,
      ).then((res) => res.arrayBuffer());

      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "生成しました",
              icon_url: config.image.successIcon,
            },
            image: {
              url: "attachment://graph.png",
            },
          },
        ],
        files: [new AttachmentBuilder(Buffer.from(image)).setName("graph.png")],
      }));
    } catch {
      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "生成できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "数式を変えてやり直してください",
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
        option.setName("formula").setDescription("数式").setRequired(true),
      )
      .addIntegerOption((option) =>
        option.setName("from").setDescription("始点X座標").setMinValue(-500).setMaxValue(500),
      )
      .addIntegerOption((option) =>
        option.setName("to").setDescription("終点X座標").setMinValue(-500).setMaxValue(500),
      );
  }
}

export default GraphCommand;
