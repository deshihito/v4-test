import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  PermissionFlagsBits,
  ModalBuilder,
  LabelBuilder,
  TextInputStyle,
  TextInputBuilder,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class GuidelineCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "guideline";
  public readonly description: string = "サーバーのガイドラインを作成します";
  public readonly example: string[] = ["/guideline @Role"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageRoles];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
  ];

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

    const role = interaction.options.getRole("role", true);

    if (!("editable" in role))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "BOTに権限がありません",
              icon_url: config.image.errorIcon,
            },
            description: "指定したロールがBOTより上か、管理されているロールです",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const text = new LabelBuilder()
      .setLabel("テンプレートを編集してガイドラインを作成してください")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("text")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(3000)
          .setValue(
            "` 1 ` **１つ目のガイドライン**\n\n` 2 ` **２つ目のガイドライン**\n\n` 3 ` **３つ目のガイドライン**\n\n` 4 ` **４つ目のガイドライン**\n",
          ),
      );

    const guide = new ModalBuilder()
      .setCustomId(`guideline_${role.id}`)
      .setTitle("ガイドラインの作成")
      .addLabelComponents(text);

    await interaction.showModal(guide);
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addRoleOption((option) =>
        option.setName("role").setDescription("付与するロール").setRequired(true),
      );
  }
}

export default GuidelineCommand;
