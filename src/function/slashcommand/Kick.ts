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
  MessageFlags,
  ButtonStyle,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import Fetch from "@/Models/Fetch";
import CommandUtils from "@/util/CommandUtils";

class KickCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "kick";
  public readonly description: string = "メンバーをサーバーからキックします";
  public readonly example: string[] = ["/kick @User", "/kick @User 規約違反のため"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.KickMembers];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.KickMembers];

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

    const user = interaction.options.getUser("user", true);
    const reason = `理由: ${interaction.options.getString("reason") || "なし"}\n${interaction.user.tag}によってKICK`;

    const member = await Fetch.member(interaction.guild, user.id);
    if (!member)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "キックできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定したユーザーが取得できません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (member.user.id === interaction.user.id)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "キックできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "自分自身をキックすることはできません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await interaction.deferReply();
    try {
      await member.kick(reason);

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${member.user.tag}(${member.user.id})をサーバーからキックしました`,
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
              name: "キックできませんでした",
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
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption((option) =>
        option.setName("user").setDescription("キックするメンバー").setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("reason").setDescription("理由").setMaxLength(150),
      );
  }
}

export default KickCommand;
