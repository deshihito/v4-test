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
  ShardClientUtil,
  ChannelType,
} from "discord.js";
import { guildStatistics } from "@/generated";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import calcBoost from "@/util/calcBoost";
import { prisma } from "@/Models/db";

class Serverommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "info";
  public readonly name: string = "server";
  public readonly description: string = "サーバーの情報を表示します";
  public readonly example: string[] = ["/server"];

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

    await interaction.deferReply();
    try {
      const members = await interaction.guild.members.fetch();

      const bot = members.filter((m) => m.user.bot);

      const channels = await interaction.guild.channels.fetch();

      const text = channels.filter((ch) => ch && ch.type === ChannelType.GuildText);
      const voice = channels.filter((ch) => ch && ch.type === ChannelType.GuildVoice);
      const category = channels.filter((ch) => ch && ch.type === ChannelType.GuildCategory);

      const roles = await interaction.guild.roles.fetch();
      const emojis = await interaction.guild.emojis.fetch();
      const stickers = await interaction.guild.stickers.fetch();

      const shardCount = interaction.client.shard
        ? `\nシャード:${ShardClientUtil.shardIdForGuildId(interaction.guild.id, config.shardCount)}番`
        : "";

      const stats: guildStatistics | null = await prisma.guildStatistics.findUnique({
        where: {
          guildId: interaction.guild.id,
        },
      });

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${interaction.guild.name}の情報`,
              icon_url: config.image.successIcon,
            },
            thumbnail: {
              url: interaction.guild.iconURL({ extension: "png", size: 1024 }) || "",
            },
            fields: [
              {
                name: "ID",
                value: interaction.guild.id,
              },
              {
                name: "所有者",
                value: `<@${interaction.guild.ownerId}>`,
              },
              {
                name: "人数",
                value: `${interaction.guild.memberCount}人(ユーザー:${interaction.guild.memberCount - bot.size}人 BOT:${bot.size}人)`,
              },
              {
                name: "作成日時",
                value: `${interaction.guild.createdAt.toLocaleString("ja-JP")}\n(${Math.floor((new Date().getTime() - interaction.guild.createdAt.getTime()) / 86400000)}日前)`,
              },
              {
                name: "その他",
                value: `チャンネル:${channels.size}個(💬:${text.size} 🔊:${voice.size} 📁:${category.size})\nロール:${roles.size}個\n絵文字:${emojis.size}個\nステッカー:${stickers.size}個\nNitro:${interaction.guild.premiumSubscriptionCount}ブースト(${calcBoost(interaction.guild.premiumSubscriptionCount)}レベル)${shardCount}`,
              },
              {
                name: "統計情報",
                value: stats
                  ? `メッセージ数: ${stats.totalMessage}回\n参加数: ${stats.totalJoin}人\n脱退数: ${stats.totalLeave}人`
                  : "設定されていません",
              },
            ],
          },
        ],
      });
    } catch (error) {
      await interaction.editReply({
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
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default Serverommand;
