import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  AttachmentBuilder,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";

class ScriptEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isModalSubmit() || !interaction.customId.startsWith("script_")) return;

    const data = interaction.customId.split("_");
    const code = interaction.fields.getTextInputValue("code");

    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 5000);

    await interaction.deferReply();
    try {
      const res = await fetch("https://wandbox.org/api/compile.json", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          code: code,
          compiler: data[2],
        }),
      }).then((res) => res.json());

      if (res.status === "0") {
        try {
          await interaction.editReply({
            embeds: [
              {
                color: Colors.Green,
                author: {
                  name: "実行しました",
                  icon_url: config.image.successIcon,
                },
                description: `**コード**\n\`\`\`${code}\`\`\`\n**結果**\n\`\`\`${res.program_output || "なし"}\`\`\``,
                footer: {
                  text: `${data[1]}(${data[2]})`,
                },
              },
            ],
          });
        } catch {
          await interaction.editReply({
            embeds: [
              {
                color: Colors.Green,
                author: {
                  name: "実行しました",
                  icon_url: config.image.successIcon,
                },
                description: `**コード**\n\`\`\`${code}\`\`\`\n**結果**\n結果が長すぎた為添付ファイルに出力しました`,
                footer: {
                  text: `${data[1]}(${data[2]})`,
                },
              },
            ],
            files: [new AttachmentBuilder(Buffer.from(res.program_output)).setName("data.txt")],
          });
        }
      } else {
        try {
          await interaction.editReply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "実行できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: `**コード**\n\`\`\`${code}\`\`\`\n**エラー**\n\`\`\`${res.compiler_error || res.program_error}\`\`\``,
                footer: {
                  text: `${data[1]}(${data[2]})`,
                },
              },
            ],
          });
        } catch {
          await interaction.editReply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "実行できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: `**コード**\n\`\`\`${code}\`\`\`\n**エラー**\nエラーが長すぎる為添付ファイルに出力しました`,
                footer: {
                  text: `${data[1]}(${data[2]})`,
                },
              },
            ],
            files: [
              new AttachmentBuilder(Buffer.from(res.compiler_error || res.program_error)).setName(
                "error.txt",
              ),
            ],
          });
        }
      }
    } catch (error) {
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "正常に実行できませんでした",
              icon_url: config.image.errorIcon,
            },
            fields: [
              {
                name: "エラーコード",
                value: `\`\`\`${error}\`\`\``,
              },
            ],
            footer: {
              text: `${data[1]}(${data[2]})`,
            },
          },
        ],
      });
    }
  }
}

export default ScriptEvent;
