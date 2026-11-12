import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  TextInputBuilder,
  TextDisplayBuilder,
  ModalBuilder,
  TextInputStyle,
  LabelBuilder,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";

class ScriptCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "bot";
  public readonly name: string = "report";
  public readonly description: string = "サポートに通報します";
  public readonly example: string[] = ["/report"];

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

    const title = new LabelBuilder()
      .setLabel("用件")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("title")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("通報する用件を簡潔に入力してください")
          .setMinLength(5)
          .setMaxLength(50),
      );

    const id = new LabelBuilder()
      .setLabel("対象のID")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("id")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("ユーザーID又はサーバーIDを入力してください")
          .setMinLength(15)
          .setMaxLength(20),
      );

    const reason = new LabelBuilder()
      .setLabel("理由")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("reason")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("可能な限り詳しく入力してください")
          .setMinLength(10)
          .setMaxLength(500),
      );

    const report = new ModalBuilder()
      .setCustomId("report")
      .setTitle("通報")
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "記入された内容はサポートサーバーに送信されます\n虚偽の報告などを行うと報告者が処罰されることがあります",
        ),
      )
      .addLabelComponents(title)
      .addLabelComponents(id)
      .addLabelComponents(reason);

    await interaction.showModal(report);
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default ScriptCommand;
