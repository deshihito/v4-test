import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { MathResponse } from "@/@types/Api";
import { v2 } from "@/util/v2";

class MathCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "math";
  public readonly description: string = "式を計算します";
  public readonly example: string[] = ["/math 4 * 25"];

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

    await interaction.deferReply();
    await interaction.editReply(v2({
      embeds: [
        {
          color: Colors.Aqua,
          description: `計算しています...少々お待ちください`,
        },
      ],
    }));

    const abort = new AbortController();
    const abortTimer = setTimeout(() => abort.abort(), 7000);

    try {
      const data: MathResponse = await fetch(
        `http://www.rurihabachi.com/web/webapi/calculator/json?exp=${encodeURIComponent(formula)}`,
        { signal: abort.signal },
      ).then((res) => res.json());

      clearTimeout(abortTimer);

      if (data.status !== 0) {
        await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "計算できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: `エラーコード: ${data.message}`,
            },
          ],
        }));
      } else {
        await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "計算しました",
                icon_url: config.image.successIcon,
              },
              description: `**式**\n\`\`\`${formula}\`\`\`\n**結果**\n\`\`\`${data.value[0].calculatedvalue}\`\`\``,
            },
          ],
        }));
      }
    } catch {
      clearTimeout(abortTimer);
      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "計算できませんでした",
              icon_url: config.image.errorIcon,
            },
            description:
              "サーバーエラーまたは計算エラーが発生しました。\n時間を空けて試すか、計算式を変えてやり直してください",
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
        option.setName("formula").setDescription("計算式").setRequired(true),
      );
  }
}

export default MathCommand;
