import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class AuthCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "auth";
  public readonly description: string = "メンバー認証を設定します";
  public readonly example: string[] = ["/auth 標準 @role"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.Administrator];

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

    const type = interaction.options.getString("type", true) as "normal" | "math" | "image" | "web";
    const role = interaction.options.getRole("role", true);

    const color = {
      normal: Colors.White,
      math: Colors.Blue,
      image: Colors.Green,
      web: Colors.Yellow,
    };

    if (!("editable" in role))
      return await interaction.reply(v2({
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
      }));

    try {
      await interaction.channel.send(v2({
        embeds: [
          {
            color: color[type],
            description: `<@&${role.id}>を貰うには、認証ボタンを押してください`,
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`${type}_${role.id}`)
              .setStyle(ButtonStyle.Primary)
              .setLabel("認証"),
          ),
        ],
      }));

      await interaction.deferReply().then(() => interaction.deleteReply());
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "認証機能の作成に失敗しました",
              icon_url: config.image.errorIcon,
            },
            description: "BOTの権限等を確認してもう一度実行してください",
            fields: [
              {
                name: "エラーコード",
                value: `\`\`\`${error}\`\`\``,
              },
            ],
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("サポートサーバー")
              .setURL(config.inviteUrl)
              .setStyle(ButtonStyle.Link),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("認証方式")
          .setRequired(true)
          .addChoices(
            { name: "標準", value: "normal" },
            { name: "計算", value: "math" },
            { name: "画像", value: "image" },
            { name: "ウェブ", value: "web" },
          ),
      )
      .addRoleOption((option) =>
        option.setName("role").setDescription("付与するロール").setRequired(true),
      );
  }
}

export default AuthCommand;
