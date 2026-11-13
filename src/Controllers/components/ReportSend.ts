import {
  Client,
  Colors,
  ComponentType,
  InteractionResponse,
  MessageFlags,
  Message,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import config from "@/config";
import { reportActionType, reportTargetType } from "@/generated";
import Fetch from "@/Models/Fetch";
import Mute from "@/Models/Mute";
import { findAdminUniqueByUserId } from "@/Models/Admin";
import { findTmpReport, deleteTmpReport, createReport, findUserAddress } from "@/Models/Report";
import { v2 } from "@/util/v2";

class ReportSendEvent implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "reportsend_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: ModalSubmitInteraction,
  ): Promise<InteractionResponse<boolean> | Message | void> {

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

    const adminData = await findAdminUniqueByUserId(interaction.user.id);

    if (!adminData)
      return await interaction.reply(v2({
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
      }));

    const reportData = await findTmpReport(data[2]);

    if (!reportData)
      return await interaction.reply(v2({
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
      }));

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
        const userAddressData = await findUserAddress(reportData.targetId);

        if (!userAddressData)
          return await interaction.reply(v2({
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
          }));

        await Mute.addIp(userAddressData.address, reason);
      } else if (actionType === reportActionType.unMuteIp) {
        const userAddressData = await findUserAddress(reportData.targetId);

        if (!userAddressData)
          return await interaction.reply(v2({
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
          }));

        await Mute.deleteIp(userAddressData.address, reason);
      } else if (actionType === "warn") {
        if (reportData.targetType === reportTargetType.user) {
          const user = await Fetch.user(interaction.client, reportData.targetId);
          if (!user)
            return await interaction.editReply(v2({
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
            }));

          await user.send(v2({
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
          }));
        } else {
          const guild = await Fetch.guild(interaction.client, reportData.targetId);
          if (!guild)
            return await interaction.editReply(v2({
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
            }));

          const owner = await guild.fetchOwner();

          await owner.send(v2({
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
          }));
        }
      }

      if (!interaction.message)
        return await interaction.editReply(v2({
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
        }));

      await interaction.message.edit(
        interaction.message.flags.has(MessageFlags.IsComponentsV2)
          ? {
              components: interaction.message.components
                .map((component) => component.toJSON())
                .filter((component) => component.type !== ComponentType.ActionRow),
              flags: MessageFlags.IsComponentsV2,
            }
          : v2({ embeds: interaction.message.embeds, components: [] }),
      );

      await deleteTmpReport(reportData.id);

      await createReport({
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
      });

      await interaction.editReply(v2({
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
      }));
    } catch (error) {
      await interaction.editReply(v2({
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
      }));
    }
  }
}

export default ReportSendEvent;
