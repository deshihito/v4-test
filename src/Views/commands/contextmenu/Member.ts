import {
  Client,
  RepliableInteraction,
  InteractionResponse,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class MemberContextMenu implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "contextmenu";
  public readonly name: string = "メンバー情報を表示";
  public readonly description: string = "メンバーの詳細を表示します";
  public readonly example: string[] = [];

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
      !interaction.isUserContextMenuCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const member = interaction.options.getMember("user");

    if (!member || !("user" in member))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "メンバーを取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定したメンバーはサーバーに存在していません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      const joinData = member.joinedAt
        ? `${member.joinedAt.toLocaleString("ja-JP")}\n(${Math.floor((new Date().getTime() - member.joinedAt.getTime()) / 86400000)}日前)`
        : "不明";

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${member.user.displayName}の検索結果`,
              url: `https://discord.com/users/${member.user.id}`,
              icon_url: config.image.successIcon,
            },
            thumbnail: {
              url:
                member.user.avatarURL({ extension: "png", size: 1024 }) ||
                member.user.defaultAvatarURL,
            },
            fields: [
              {
                name: "ID",
                value: member.user.id,
                inline: true,
              },
              {
                name: "ニックネーム",
                value: member.nickname || "未設定",
                inline: true,
              },
              {
                name: "作成日時",
                value: `${member.user.createdAt.toLocaleString("ja-JP")}\n(${Math.floor((new Date().getTime() - member.user.createdAt.getTime()) / 86400000)}日前)`,
                inline: true,
              },
              {
                name: "参加日時",
                value: joinData,
                inline: true,
              },
              {
                name: "アカウントの種類",
                value: member.user.bot ? "BOT" : "ユーザー",
                inline: true,
              },
              {
                name: "ロール",
                value: member.roles.cache.toJSON().join(""),
              },
            ],
          },
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
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
      });
    }
  }

  public build(): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder().setName(this.name).setType(ApplicationCommandType.User);
  }
}

export default MemberContextMenu;
