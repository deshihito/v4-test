import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Role,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import Permission from "@/util/Permission";

class RoleCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "info";
  public readonly name: string = "role";
  public readonly description: string = "ロールの内容を表示します";
  public readonly example: string[] = ["/role @Notice"];

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

    const role = interaction.options.getRole("name", true);

    if (!(role instanceof Role))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "完全なロールが取得できませんでした",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${role.name}の情報`,
              icon_url: config.image.successIcon,
            },
            fields: [
              {
                name: "ID",
                value: role.id,
                inline: true,
              },
              {
                name: "位置",
                value: `${role.position}番目`,
                inline: true,
              },
              {
                name: "メンション",
                value: role.mentionable ? "可能" : "不可能",
                inline: true,
              },
              {
                name: "表示形式",
                value: role.hoist ? "別々" : "混合",
                inline: true,
              },
              {
                name: "色",
                value: role.hexColor,
                inline: true,
              },
              {
                name: "外部サービスによる管理",
                value: role.managed ? "管理済み" : "未管理",
                inline: true,
              },
              {
                name: "作成日時",
                value: `${role.createdAt.toLocaleString("ja-JP")}\n(${Math.floor((new Date().getTime() - role.createdAt.getTime()) / 86400000)}日前)`,
                inline: true,
              },
              {
                name: "メンバー数",
                value: `${role.members.size}人`,
                inline: true,
              },
              {
                name: "権限",
                value: `\`${role.permissions
                  .toArray()
                  .map((per) => Permission.StrToName(per))
                  .join("`,`")}\``,
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

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addRoleOption((option) =>
        option.setName("name").setDescription("表示するロール").setRequired(true),
      );
  }
}

export default RoleCommand;
