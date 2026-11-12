import {
  Client,
  PermissionFlagsBits,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import matchId from "@/util/matchId";
import config from "@/config";
import Fetch from "@/Models/Fetch";
import CommandUtils from "@/util/CommandUtils";

class BanCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "ban";
  public readonly description: string = "ユーザーをサーバーからBANします";
  public readonly example: string[] = [
    "/ban @User",
    "/ban @User 規約違反のため",
    "/ban 1066168542669590598",
  ];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.BanMembers];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.BanMembers];

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

    const id: string = interaction.options.getString("id", true);
    const reason: string = `理由: ${interaction.options.getString("reason") || "なし"}\n${interaction.user.tag}によってBAN`;
    const days: number | null = interaction.options.getInteger("days");

    const userId = matchId(id);
    if (!userId)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "BANできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "ユーザーID、メンションを入力してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const user = await Fetch.user(interaction.client, userId);
    if (!user)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "BANできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定したユーザーが存在しません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (user.id === interaction.user.id)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "BANできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "自分自身をBANすることはできません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await interaction.deferReply();
    try {
      await interaction.guild.bans.create(user.id, {
        reason: reason,
        deleteMessageDays: days || undefined,
      });

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${user.tag}(${user.id}) をサーバーからBANしました`,
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } catch (error) {
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "BANできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "BOTの権限が不足しているか、ユーザーが正しく指定されていません",
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
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("id")
          .setDescription("ユーザーID・メンション")
          .setMaxLength(50)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("reason").setDescription("理由").setMaxLength(150),
      )
      .addIntegerOption((option) =>
        option.setName("days").setDescription("メッセージを削除する日数").setMaxValue(7),
      );
  }
}

export default BanCommand;
