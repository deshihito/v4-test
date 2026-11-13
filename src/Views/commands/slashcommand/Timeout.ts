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
  User,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import Fetch from "@/Models/Fetch";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class TimeoutCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "timeout";
  public readonly description: string = "メンバーをタイムアウトします";
  public readonly example: string[] = ["/timeout @User", "/timeout @User 1000 スパムのため"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ModerateMembers];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.ModerateMembers];

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

    const user: User = interaction.options.getUser("user", true);
    const time: number = interaction.options.getInteger("time") || 30;
    const reason: string = `理由: ${interaction.options.getString("reason") || "なし"}\n${interaction.user.tag}によってタイムアウト`;

    const member = await Fetch.member(interaction.guild, user.id);
    if (!member)
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "タイムアウトできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "メンバーが取得できません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    if (member.user.id === interaction.user.id)
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "タイムアウトできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "自分自身をタイムアウトすることはできません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    await interaction.deferReply();
    try {
      await member.timeout(time * 1000, reason);

      await interaction.editReply(v2({
        content: `<@${interaction.user.id}>`,
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${member.user.tag}を${time}秒タイムアウトしました`,
              icon_url: config.image.successIcon,
            },
          },
        ],
      }));
    } catch (error) {
      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "タイムアウトできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "BOTの権限が不足しているか、メンバーが正しく指定されていません",
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
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption((option) =>
        option.setName("user").setDescription("タイムアウトするメンバー").setRequired(true),
      )
      .addIntegerOption((option) =>
        option.setName("time").setDescription("時間(秒)").setMaxValue(2419200),
      )
      .addStringOption((option) =>
        option.setName("reason").setDescription("理由").setMaxLength(150),
      );
  }
}

export default TimeoutCommand;
