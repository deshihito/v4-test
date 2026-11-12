import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  AttachmentBuilder,
  Message,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { QrReadResponse } from "@/@types/Api";
import isUrl from "@/util/isUrl";

class QrCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "qr";
  public readonly description: string = "QRコードの読み取りや生成をします";
  public readonly example: string[] = [
    "/qr 読み込む https://example.com/qr.png",
    "/qr 生成 Apple 高",
  ];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | Message | void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const type: string = interaction.options.getString("type", true);
    const text: string = interaction.options.getString("text", true);
    const ecc: string = interaction.options.getString("ecc") || "L";

    if (type === "generate") {
      await interaction.deferReply();
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            title: "生成中...",
          },
        ],
      });

      const image: ArrayBuffer = await fetch(
        `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=256x256&extension=png&ecc=${ecc}`,
      ).then((res) => res.arrayBuffer());

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "QRコードを作成しました",
              icon_url: config.image.successIcon,
            },
            description: `内容\n\`\`\`${text}\`\`\``,
            image: {
              url: "attachment://QRcode.png",
            },
          },
        ],
        files: [new AttachmentBuilder(Buffer.from(image)).setName("QRcode.png")],
      });
    } else {
      if (!isUrl(text))
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "QRコードが読み取れません",
                icon_url: config.image.errorIcon,
              },
              description: "QRコードはURLで指定する必要があります",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      await interaction.deferReply();
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            title: "読み取り中...",
          },
        ],
      });

      const data: QrReadResponse[] = await fetch(
        `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(text)}`,
      ).then((res) => res.json());

      if (data[0].symbol[0].error)
        return await interaction.editReply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "QRコードが読み取れません",
                icon_url: config.image.errorIcon,
              },
              description: "QRコードはURLかつ、読み取れる必要があります",
            },
          ],
        });

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "QRコードを読み取りました",
              icon_url: config.image.successIcon,
            },
            description: `内容\n\`\`\`${data[0].symbol[0].data}\`\`\``,
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
        option
          .setName("type")
          .setDescription("実行する操作")
          .setRequired(true)
          .addChoices({ name: "生成", value: "generate" }, { name: "読み取り", value: "read" }),
      )
      .addStringOption((option) =>
        option
          .setName("text")
          .setDescription("テキスト又はURL")
          .setMaxLength(800)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("ecc")
          .setDescription("冗長性(生成時のみ)")
          .addChoices(
            { name: "低", value: "L" },
            { name: "中", value: "M" },
            { name: "高", value: "H" },
          ),
      );
  }
}

export default QrCommand;
