import {
  Client,
  InteractionResponse,
  Colors,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import {
  listGlobalChats,
  listGlobalChatTransferHistoryBySourceId,
  deleteGlobalChatTransferHistoryBySourceId,
} from "@/Models/GlobalChat";
import crypto from "crypto";

class DeleteSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "delete";
  public readonly description: string = "グローバルチャットの転送されたメッセージを削除します";
  public readonly example: string[] = [];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

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

    const id = interaction.options.getInteger("id", true);

    const allTransferData = await listGlobalChatTransferHistoryBySourceId(id);

    if (allTransferData.length === 0)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "転送されたメッセージを削除できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定されたIDの転送履歴が存在しません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await interaction.deferReply();
    await interaction.editReply({
      embeds: [
        {
          color: Colors.Yellow,
          author: {
            name: "メッセージを削除しています...",
            icon_url: config.image.warnIcon,
          },
          description: `推定所要時間: ${Math.round((allTransferData.length * 18) / 100) / 10}秒`,
        },
      ],
    });
    const startTime = Date.now();

    let Success = 0;
    let RetrySuccess = 0;
    const retryStatusCode = [429, 500, 502];

    const globalChatData = await listGlobalChats();
    const gcWebhook: Record<string, string> = {};
    for (const gc of globalChatData) {
      gcWebhook[gc.guildId] = gc.webhookUrl;
    }

    const pendingList: Promise<true>[] = [];

    for (const transferData of allTransferData) {
      pendingList.push(
        (async (): Promise<true> => {
          if (!gcWebhook[transferData.guildId]) return true;

          let isResend = false; //再送処理必要(while繰り返し条件フラグ)
          let retryCount = 0; //再送回数(break条件)
          let isRetry = false; //再送発生認識

          do {
            if (isResend) {
              retryCount++;
              isResend = false;
            }
            if (retryCount > 5) {
              console.warn("gc削除 再送処理中止 ログを確認してください");
              return true;
            }

            const response = await fetch(
              `${gcWebhook[transferData.guildId]}/messages/${transferData.messageId}`,
              {
                method: "DELETE",
              },
            );

            if (response.ok) {
              Success++;
              isRetry ? RetrySuccess++ : {};
            } else {
              console.warn("gc削除処理エラー status:", response.status);

              if (retryStatusCode.includes(response.status)) {
                isRetry = true;
                isResend = true;

                let waitMs = 0;
                if (response.status === 429) {
                  waitMs = Number(response.headers.get("X-RateLimit-Reset-After")) * 1000;
                }

                await new Promise<void>((resolve) => {
                  setTimeout(
                    () => {
                      resolve();
                    },
                    waitMs + crypto.randomInt(300, 750),
                  );
                });
              }
            }
          } while (isResend);
          return true;
        })(),
      );
    }

    // ステータスコード404ではデータベースから削除しない
    // メッセージを送信したwebhookと一致しないwebhookがメッセージを削除しようとすると404になるため、webhookの有無判定には使えない。

    await Promise.all(pendingList);

    await deleteGlobalChatTransferHistoryBySourceId(id);

    const time = Math.round((Date.now() - startTime) / 100) / 10;

    await interaction.editReply({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: "転送されたメッセージを削除しました",
            icon_url: config.image.successIcon,
          },
          description: `送信元ID: ${id}\n成功件数: ${Success}\n> 再送件数: ${RetrySuccess}\n> 総件数: ${allTransferData.length}\n-# 所要時間:${time}秒;`,
        },
      ],
    });
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option.setName("id").setDescription("転送元ID").setRequired(true),
      );
  }
}

export default DeleteSubCommand;
