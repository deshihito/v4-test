import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import Fetch from "@/Models/Fetch";
import CommandUtils from "@/Controllers/CommandUtils";
import matchId from "@/util/matchId";
import { v2 } from "@/util/v2";

class UserCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "info";
  public readonly name: string = "user";
  public readonly description: string = "ユーザーの情報を表示します";
  public readonly example: string[] = ["/user @User", "/user 98131191981054804"];

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

    const id = interaction.options.getString("id");

    if (!id) {
      const joinData = interaction.member.joinedAt
        ? `${interaction.member.joinedAt.toLocaleString("ja-JP")}\n(${Math.floor((new Date().getTime() - interaction.member.joinedAt.getTime()) / 86400000)}日前)`
        : "不明";

      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${interaction.user.displayName}の検索結果`,
              url: `https://discord.com/users/${interaction.user.id}`,
              icon_url: config.image.successIcon,
            },
            thumbnail: {
              url:
                interaction.user.avatarURL({ extension: "png", size: 1024 }) ||
                interaction.user.defaultAvatarURL,
            },
            fields: [
              {
                name: "ID",
                value: interaction.user.id,
                inline: true,
              },
              {
                name: "ニックネーム",
                value: interaction.member.nickname || "未設定",
                inline: true,
              },
              {
                name: "作成日時",
                value: `${interaction.user.createdAt.toLocaleString("ja-JP")}\n(${Math.floor((new Date().getTime() - interaction.user.createdAt.getTime()) / 86400000)}日前)`,
                inline: true,
              },
              {
                name: "参加日時",
                value: joinData,
                inline: true,
              },
              {
                name: "アカウントの種類",
                value: interaction.user.bot ? "BOT" : "ユーザー",
                inline: true,
              },
              {
                name: "ロール",
                value: interaction.member.roles.cache.toJSON().join(""),
              },
            ],
          },
        ],
      }));
    } else {
      const userId = matchId(id);
      if (!userId)
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "取得できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "ユーザーID、メンションを入力してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        }));

      const member = await Fetch.member(interaction.guild, userId);
      if (member) {
        const joinData = member.joinedAt
          ? `${member.joinedAt.toLocaleString("ja-JP")}\n(${Math.floor((new Date().getTime() - member.joinedAt.getTime()) / 86400000)}日前)`
          : "不明";

        await interaction.reply(v2({
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
        }));
      } else {
        const user = await Fetch.user(interaction.client, userId);
        if (!user)
          return await interaction.reply(v2({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "取得できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "指定したユーザーが存在しません",
              },
            ],
            flags: MessageFlags.Ephemeral,
          }));

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${user.displayName}の検索結果`,
                url: `https://discord.com/users/${user.id}`,
                icon_url: config.image.successIcon,
              },
              thumbnail: {
                url: user.avatarURL({ extension: "png", size: 1024 }) || user.defaultAvatarURL,
              },
              fields: [
                {
                  name: "ID",
                  value: user.id,
                  inline: true,
                },
                {
                  name: "作成日時",
                  value: `${user.createdAt.toLocaleString("ja-JP")}\n(${Math.floor((new Date().getTime() - user.createdAt.getTime()) / 86400000)}日前)`,
                  inline: true,
                },
                {
                  name: "アカウントの種類",
                  value: user.bot ? "BOT" : "ユーザー",
                  inline: true,
                },
              ],
            },
          ],
        }));
      }
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) => option.setName("id").setDescription("ユーザーID・メンション"));
  }
}

export default UserCommand;
