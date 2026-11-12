import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  MessageFlags,
  Message,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";
import { reportActionType, reportTargetType } from "@/generated";
import Fetch from "@/Models/Fetch";
import Mute from "@/Models/Mute";
import { prisma } from "@/Models/db";

class ReportSendEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: BaseInteraction,
  ): Promise<InteractionResponse<boolean> | Message | void> {
    if (!interaction.isModalSubmit() || !interaction.customId.startsWith("reportsend_")) return;

    const title = interaction.fields.getTextInputValue("title");
    const reason = interaction.fields.getTextInputValue("reason");

    const data = interaction.customId.split("_");
    const actionType = data[1] as reportActionType;

    const type: { [key: string]: string } = {
      muteUser: "ユーザーをミュート",
      unMuteUser: "ユーザーのミュートを解除",
      muteGuild: "サーバーをミュート",
      unMuteGuild: "サーバーのミュートを解除",
      muteIp: "IPをミュート",
      unMuteIp: "IPミュートを解除",
      warn: "警告",
      delete: "棄却",
    };

    const adminData = await prisma.admin.findUnique({
      where: {
        userId: interaction.user.id,
      },
    });

    if (!adminData)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "通報を処理できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "管理者しか実行できません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const reportData = await prisma.tmpReport.findUnique({
      where: {
        id: data[2],
      },
    });

    if (!reportData)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "通報を処理できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "無効な通報です",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await interaction.deferReply();
    try {
      if (actionType === reportActionType.muteUser) {
        await Mute.addUser(reportData.targetId, reason);
      } else if (actionType === reportActionType.unMuteUser) {
        await Mute.deleteUser(reportData.targetId, reason);
      } else if (actionType === reportActionType.muteGuild) {
        await Mute.addGuild(reportData.targetId, reason);
      } else if (actionType === reportActionType.unMuteGuild) {
        await Mute.deleteGuild(reportData.targetId, reason);
      } else if (actionType === reportActionType.muteIp) {
        const userAddressData = await prisma.userAddress.findUnique({
          where: {
            userId: reportData.targetId,
          },
        });

        if (!userAddressData)
          return await interaction.reply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "通報を処理できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "IPアドレスが存在しません",
              },
            ],
            flags: MessageFlags.Ephemeral,
          });

        await Mute.addIp(userAddressData.address, reason);
      } else if (actionType === reportActionType.unMuteIp) {
        const userAddressData = await prisma.userAddress.findUnique({
          where: {
            userId: reportData.targetId,
          },
        });

        if (!userAddressData)
          return await interaction.reply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "通報を処理できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "IPアドレスが存在しません",
              },
            ],
            flags: MessageFlags.Ephemeral,
          });

        await Mute.deleteIp(userAddressData.address, reason);
      } else if (actionType === "warn") {
        if (reportData.targetType === reportTargetType.user) {
          const user = await Fetch.user(interaction.client, reportData.targetId);
          if (!user)
            return await interaction.editReply({
              embeds: [
                {
                  color: Colors.Red,
                  author: {
                    name: "通報を処理できませんでした",
                    icon_url: config.image.errorIcon,
                  },
                  description: "対象のユーザーが存在しません",
                },
              ],
            });

          await user.send({
            embeds: [
              {
                color: Colors.Yellow,
                author: {
                  name: "TakasumiBOTから警告されました",
                  icon_url: config.image.warnIcon,
                },
                description: `あなたは以下の理由によって通報されたことにより警告されました\n繰り返し警告されるとサービスの利用を拒否する場合があります\n\n${reason}\n\n質問や異議申し立ては[サポートサーバー](${config.inviteUrl})まで`,
              },
            ],
          });
        } else {
          const guild = await Fetch.guild(interaction.client, reportData.targetId);
          if (!guild)
            return await interaction.editReply({
              embeds: [
                {
                  color: Colors.Red,
                  author: {
                    name: "通報を処理できませんでした",
                    icon_url: config.image.errorIcon,
                  },
                  description: "対象のサーバーが存在しません",
                },
              ],
            });

          const owner = await guild.fetchOwner();

          await owner.send({
            embeds: [
              {
                color: Colors.Yellow,
                author: {
                  name: "TakasumiBOTから警告されました",
                  icon_url: config.image.warnIcon,
                },
                description: `あなたが所有している${guild.name}(${guild.id})のサーバーは以下の理由によって通報されたことにより警告されました\n繰り返し警告されるとサービスの利用を拒否する場合があります\n\n${reason}\n\n質問や異議申し立ては[サポートサーバー](${config.inviteUrl})まで`,
              },
            ],
          });
        }
      }

      if (!interaction.message)
        return await interaction.editReply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "通報を処理できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "通報のメッセージが取得できません",
            },
          ],
        });

      await interaction.message.edit({
        embeds: interaction.message.embeds,
        components: [],
      });

      await prisma.tmpReport.delete({
        where: {
          id: reportData.id,
        },
      });

      await prisma.report.create({
        data: {
          id: reportData.id,
          targetId: reportData.targetId,
          targetType: reportData.targetType,
          title: title,
          reason: reason,
          reporterId: reportData.reporterId,
          originalTitle: reportData.title,
          originalReason: reportData.reason,
          action: actionType,
          originalCreatedAt: reportData.createdAt,
        },
      });

      await interaction.editReply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "通報を処理しました",
              icon_url: config.image.successIcon,
            },
            description: `${type[data[1]]}しました\n\n用件: ${title}\n理由: ${reason}`,
            footer: {
              text: `${interaction.user.displayName}(${interaction.user.id})`,
              icon_url:
                interaction.user.avatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png",
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
              name: "通報を処理できませんでした",
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
      });
    }
  }
}

export default ReportSendEvent;
