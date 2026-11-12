import {
  Client,
  InteractionResponse,
  Colors,
  ChannelType,
  MessageFlags,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/util/CommandUtils";
import config from "@/config";
import { prisma } from "@/Models/db";
import deleteDuplicateWebhook from "@/util/deleteDuplicateWebhook";
import deleteWebhook from "@/util/deleteWebhook";

class JoinSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "join";
  public readonly description: string =
    "参加メッセージを設定(更新)します。無効にする場合は message オプションを空欄にしてください。";
  public readonly example: string[] = ["/setting join [User]が参加しました"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ManageWebhooks,
  ];

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: ValidSubCommandInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      interaction.options.getSubcommand() !== this.name ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const message: string | null = interaction.options.getString("message");

    const noticeData = await prisma.joinNotice.findUnique({
      where: {
        guildId: interaction.guildId,
      },
    });

    if (
      noticeData &&
      interaction.channelId === noticeData.channelId &&
      typeof message === "string" &&
      message.length > 0
    ) {
      if (message.length > 100)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "参加メッセージを更新できませんでした",
                icon_url: config.image.successIcon,
              },
              description: `参加メッセージは100文字以内にしてください`,
            },
          ],
        });
      await prisma.joinNotice.update({
        where: {
          guildId: interaction.guildId,
        },
        data: {
          message: message,
        },
      });

      return await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "参加メッセージを更新しました",
              icon_url: config.image.successIcon,
            },
            description: `設定したメッセージ: \`\`\`${message}\`\`\``,
          },
        ],
      });
    }

    if (noticeData) {
      const joinNotice = await prisma.joinNotice.delete({
        where: {
          guildId: interaction.guildId,
        },
      });

      void deleteWebhook(joinNotice.webhookUrl);

      return await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "参加メッセージを無効にしました",
              icon_url: config.image.successIcon,
            },
            description:
              "以前の参加メッセージは以下の通りです\n```" +
              noticeData.message +
              "```\n-# 参加メッセージが設定されたチャンネルでこのコマンドを実行すると、\n-# 参加メッセージを更新できるようになりました",
          },
        ],
      });
    }

    if (!message)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "参加メッセージを設定できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "メッセージを入力してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (message.length > 100)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "参加メッセージを設定できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "メッセージは100文字以内にしてください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (interaction.channel.type !== ChannelType.GuildText)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "参加メッセージを設定できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "メッセージを送信するチャンネルはテキストチャンネルにしてください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await interaction.deferReply();
    await deleteDuplicateWebhook(interaction.channel, ["TakasumiBOT joinNotice"]);

    try {
      const webhook = await interaction.channel.createWebhook({
        name: "TakasumiBOT joinNotice",
        avatar: config.image.botIcon,
      });

      await prisma.joinNotice.create({
        data: {
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          webhookUrl: webhook.url,
          message: message,
        },
      });

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "参加メッセージを設定しました",
              icon_url: config.image.successIcon,
            },
            description: `設定したメッセージ: \`\`\`${message}\`\`\``,
          },
        ],
      });
    } catch (error) {
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "参加メッセージを設定できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "BOTの権限が不足しているか、\nwebhookの作成回数が上限に達しています。",
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

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) => option.setName("message").setDescription("送信するメッセージ"));
  }
}

export default JoinSubCommand;
