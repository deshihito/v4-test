import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  Message,
  MessageFlags,
  LabelBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";
import { prisma } from "@/Models/db";

class ReportModalEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: BaseInteraction,
  ): Promise<InteractionResponse<boolean> | Message | void> {
    if (!interaction.isButton() || !interaction.customId.startsWith("report_")) return;

    const data = interaction.customId.split("_");

    const reportData = await prisma.tmpReport.findUnique({
      where: {
        id: data[2],
      },
    });

    if (!reportData)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "通報を処理できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "無効な通報です",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const title = new LabelBuilder()
      .setLabel("用件")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("title")
          .setStyle(TextInputStyle.Short)
          .setMinLength(5)
          .setMaxLength(50)
          .setValue(reportData.title),
      );

    const reason = new LabelBuilder()
      .setLabel("理由")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("reason")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(500)
          .setValue(reportData.reason),
      );

    const report = new ModalBuilder()
      .setCustomId(`reportsend_${data[1]}_${data[2]}`)
      .setTitle("通報処理")
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("ここに入力された内容が正式な通報内容になります"),
      )
      .addLabelComponents(title)
      .addLabelComponents(reason);

    await interaction.showModal(report);
  }
}

export default ReportModalEvent;
