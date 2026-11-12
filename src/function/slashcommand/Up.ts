import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  PermissionFlagsBits,
  Colors,
  MessageFlags,
  ChannelType,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import CommandUtils from "@/util/CommandUtils";
import config from "@/config";
import { prisma } from "@/util/db";
import { NotificationQueueService } from "@/util/NotificationQueue";
import { NotificationType } from "@/generated";
import { buildBumpRtaEmbed, finishBumpRtaRound } from "@/util/bumpRta";

class UpCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "server";
  public readonly name: string = "up";
  public readonly description: string = "サーバー掲示板の順位を上げます";
  public readonly example: string[] = ["/up"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.CreateInstantInvite];

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

    const registerData = await prisma.guildBoard.findUnique({
      where: {
        guildId: interaction.guildId,
      },
    });

    if (!registerData)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "UPできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "まだ登録されていません\n`/register`を使用して登録してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (new Date().getTime() - registerData.updatedAt.getTime() < 3600000)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "UPできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: `このサーバーを上げられるようになるまであと${Math.floor((3600000 - (new Date().getTime() - registerData.updatedAt.getTime())) / 60000)}分です`,
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (
      interaction.channel.type !== ChannelType.GuildText &&
      interaction.channel.type !== ChannelType.GuildVoice &&
      interaction.channel.type !== ChannelType.GuildAnnouncement &&
      interaction.channel.type !== ChannelType.GuildStageVoice
    )
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "UPできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "テキストベースのチャンネルで実行してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (!interaction.guild.invites.cache.get(registerData.inviteUrl)) {
      const invite = await interaction.channel
        .createInvite({
          unique: false,
          maxAge: 0,
        })
        .catch(() => {});

      if (!invite)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "UPできませんでした",
                icon_url: config.image.errorIcon,
              },
              description:
                "招待リンクの再生成ができませんでした\n`/register`を使用して再登録してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      await prisma.guildBoard.update({
        where: {
          guildId: interaction.guildId,
        },
        data: {
          inviteUrl: invite.url,
        },
      });
    }

    await prisma.guildBoard.update({
      where: {
        guildId: interaction.guildId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    await interaction.reply({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: "UPしました",
            icon_url: config.image.successIcon,
          },
          image: {
            url: config.image.upGif,
          },
          description:
            "表示順位が更新されました\n[サーバー掲示板](https://servers.takasumibot.com/)で確認してね!\n1時間後に通知します",
        },
      ],
    });

    await NotificationQueueService.add({
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      type: NotificationType.tksmup,
      delay: 3600000,
    });

    // RTA: 通知からのラウンドがあれば、この UP を記録する
    if (interaction.guildId && interaction.channel) {
      const result = await finishBumpRtaRound(
        interaction.guildId,
        NotificationType.tksmup,
        interaction.user.id,
      );
      if (result) {
        await interaction.channel
          .send({ embeds: [buildBumpRtaEmbed(NotificationType.tksmup, interaction.user.id, result)] })
          .catch(() => {});
      }
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default UpCommand;
