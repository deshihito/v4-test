import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  TextInputBuilder,
  ModalBuilder,
  LabelBuilder,
  TextInputStyle,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { ScriptResponse } from "@/@types/Api";

class ScriptCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "script";
  public readonly description: string = "プログラムを実行します";
  public readonly example: string[] = ["/script"];

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

    const lang = interaction.options.getString("lang", true);

    const langData: ScriptResponse[] = await fetch("https://wandbox.org/api/list.json").then(
      (res) => res.json(),
    );

    const data = langData.find((data) => data.name === lang);
    if (!data)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "実行できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "存在しない言語です",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const code = new LabelBuilder()
      .setLabel(`${data.language}(${data.name})を実行`)
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("code")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("実行するコードを入力")
          .setMaxLength(800),
      );

    const modal = new ModalBuilder()
      .setCustomId(`script_${data.language}_${data.name}`)
      .setTitle("コードを実行")
      .addLabelComponents(code);

    await interaction.showModal(modal);
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("lang")
          .setDescription("実行する言語")
          .setRequired(true)
          .setAutocomplete(true),
      );
  }
}

export default ScriptCommand;
