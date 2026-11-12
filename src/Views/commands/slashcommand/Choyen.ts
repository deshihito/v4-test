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
const eUC = encodeURIComponent;

class ChoyenCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "fun";
  public readonly name: string = "5000";
  public readonly description: string = "5000兆円ジェネレーター";
  public readonly example: string[] = ["/5000 上の文字 下の文字"];

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

    const top = interaction.options.getString("top", true);
    const bottom = interaction.options.getString("buttom", true);
    const hoshii = interaction.options.getBoolean("hoshii") || false;
    const noalpha = interaction.options.getBoolean("noalpha") || false;
    const rainbow = interaction.options.getBoolean("rainbow") || false;

    await interaction.deferReply();
    try {
      const image = await fetch(
        `https://gsapi.cbrx.io/image?top=${eUC(top)}&bottom=${eUC(bottom)}&type=png&p=100${hoshii ? "&hoshii=true" : ""}${noalpha ? "&noalpha=true" : ""}${rainbow ? "&rainbow=true" : ""}`,
      ).then((res) => res.arrayBuffer());

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "生成しました",
              icon_url: config.image.successIcon,
            },
            image: {
              url: "attachment://5000.png",
            },
          },
        ],
        files: [new AttachmentBuilder(Buffer.from(image)).setName("5000.png")],
      });
    } catch {
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "生成できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "もう一度やり直してください",
          },
        ],
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("top").setDescription("上の文字").setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("buttom").setDescription("下の文字").setRequired(true),
      )
      .addBooleanOption((option) =>
        option.setName("hoshii").setDescription("下の文字を「欲しい！」に固定する"),
      )
      .addBooleanOption((option) => option.setName("noalpha").setDescription("背景を白色にする"))
      .addBooleanOption((option) => option.setName("rainbow").setDescription("文字を虹色にする"));
  }
}

export default ChoyenCommand;
