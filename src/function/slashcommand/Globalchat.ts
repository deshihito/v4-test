import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  PermissionFlagsBits,
  ButtonStyle,
  ChannelType,
  ButtonBuilder,
  MessageFlags,
  ActionRowBuilder,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/util/CommandUtils";
import { prisma } from "@/Models/db";
import sendGlobalChat from "@/util/sendGlobalChat";
import deleteWebhook from "@/util/deleteWebhook";
import Random from "@/util/Random";
import deleteDuplicateWebhook from "@/util/deleteDuplicateWebhook";

class GlobalchatCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "server";
  public readonly name: string = "globalchat";
  public readonly description: string =
    "色々なサーバーと繋がるグローバルチャットを有効化、無効化します";
  public readonly note: string =
    "会話を開始するにはWeb認証を利用してユーザー認証する必要があります";
  public readonly example: string[] = ["/globalchat"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageChannels];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ManageWebhooks,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ManageChannels,
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

    const guildGlobalChatData = await prisma.globalChat.findUnique({
      where: {
        guildId: interaction.guildId,
      },
    });

    if (!guildGlobalChatData) {
      if (
        interaction.guild.memberCount < 20 ||
        (await interaction.guild.members.fetch()).filter((m) => !m.user.bot).size < 10
      )
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "参加条件を満たしていません",
                icon_url: config.image.errorIcon,
              },
              description: "グローバルチャットを利用するには以下の条件を満たしている必要があります",
              fields: [
                {
                  name: "必要な条件",
                  value: "```20人以上のメンバー\n10人以上のユーザー```",
                },
              ],
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
                name: "グローバルチャットに参加できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "設定するチャンネルはテキストチャンネルにしてください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      await interaction.deferReply();
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            description: "登録中....",
          },
        ],
      });

      await deleteDuplicateWebhook(interaction.channel, ["TakasumiBOT Global"]);

      try {
        const webhook = await interaction.channel.createWebhook({
          name: "TakasumiBOT Global",
          avatar: config.image.botIcon,
        });

        await prisma.globalChat.create({
          data: {
            channelId: interaction.channelId,
            guildId: interaction.guildId,
            webhookUrl: webhook.url,
          },
        });

        await interaction.editReply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: interaction.guild.name,
                icon_url: config.image.successIcon,
              },
              description:
                "グローバルチャットに参加しました\nみんなに挨拶してみましょう!\n\nこのチャンネルに入力されたメッセージは、グローバルチャットに登録するすべてのチャンネルに送信されます\n個人情報の取り扱い、言葉遣いには十分気を付けてくださいね。\n\n※チャットを利用した場合、[TakasumiBOT利用規約](https://www.takasumibot.com/terms.html)に同意したものとみなされます。必ずご確認ください",
            },
          ],
        });

        await sendGlobalChat({
          title: `${interaction.guild.name}<${interaction.guild.id}>`,
          desc: "グローバルチャットに新しいサーバーが参加しました！\nみんなで挨拶しましょう!",
          footerText: `登録数:${await prisma.globalChat.count()}`,
          userName: "TakasumiBOT Global (System)",
          fromServerId: interaction.guild.id,
          thumbnailUrl:
            interaction.guild.iconURL({ extension: "png", size: 1024 }) ||
            "https://cdn.discordapp.com/embed/avatars/0.png",
        });
      } catch (error) {
        await interaction.editReply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "Webhookの作成に失敗しました",
                icon_url: config.image.errorIcon,
              },
              description: "BOTの権限が不足しているか,\n既にwebhookの作成回数が上限に達しています",
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
    } else {
      const gcData = await prisma.globalChat.delete({
        where: {
          guildId: interaction.guildId,
        },
      });

      void deleteWebhook(gcData.webhookUrl);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "グローバルチャット登録を解除しました",
              icon_url: config.image.successIcon,
            },
            description:
              "TakasumiBOT グローバルチャットのご利用ありがとうございました。\nこれからも、TakasumiBOTをよろしくお願いします。",
          },
        ],
      });

      sendGlobalChat({
        title: ":wave: グローバルチャットから1つのサーバーが離脱しました",
        desc: Random.getRandomElement([
          "**　　**　Λ＿Λ　　　＼＼\n　 （　・∀・）　　|　|　ｶﾞｯ\n　と　　　　）　 　 |　|\n　　 Ｙ　/ノ　　　 人\n　　　 /　）　 　 < 　>_Λ∩\n　 ＿/し'　　／／. V゜Д゜）/\n　（＿フ彡　　　　 　　/　←>>1",
          "**　**　　 ∧ ∧　 　　　　 　／￣￣￣￣￣￣￣￣￣\n|￣￣（ ﾟДﾟ)￣￣|　　＜　　もう寝る！\n|＼⌒⌒⌒⌒⌒⌒＼ 　　　＼\n|　 ＼ 　　　　    　＼ 　　　￣￣￣￣￣￣￣￣￣\n＼　 ｜⌒⌒⌒⌒⌒⌒｜\n　 ＼ |＿＿＿＿＿＿＿|",
        ]),
        userName: "TakasumiBOT Global System",
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default GlobalchatCommand;
