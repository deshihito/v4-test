import {
  Client,
  Colors,
  InteractionResponse,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  Message,
  MessageFlags,
  LabelBuilder,
  TextDisplayBuilder,
  ButtonInteraction,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import config from "@/config";
import { findTmpReport } from "@/Models/Report";
import { v2 } from "@/util/v2";

class ReportModalEvent implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "report_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: ButtonInteraction,
  ): Promise<InteractionResponse<boolean> | Message | void> {

    const data = interaction.customId.split("_");

    const reportData = await findTmpReport(data[2]);

    if (!reportData)
      return await interaction.reply(v2({
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
      }));

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
