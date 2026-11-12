import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  StringSelectMenuInteraction,
} from "discord.js";
import { CommandType, SelectController } from "@/@types/Util";
import config from "@/config";
import getParseCommands from "@/Controllers/parseCommand";

class HelpEvent implements SelectController {
  public readonly client: Client;
  public readonly kind = "select" as const;
  public readonly customId = "help_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: StringSelectMenuInteraction): Promise<InteractionResponse<boolean> | void> {

    const data = interaction.customId.split("_");
    const type = interaction.values[0] as CommandType;

    const types = {
      info: "情報",
      server: "サーバー関連",
      manage: "管理",
      tool: "ツール",
      search: "検索",
      fun: "ネタ",
      account: "アカウント",
      stock: "株",
      gift: "ギフト",
      money: "お金",
      bot: "Bot関連",
      setting: "設定",
      othor: "その他",
      contextmenu: "コンテキストメニュー",
    };

    if (data[1] !== interaction.user.id)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "ページを更新できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "このコマンドは別の人が操作しています",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      await interaction.message.edit({
        embeds: [
          {
            color: Colors.Green,
            title: `HELP ${types[type]}`,
            fields: getParseCommands()
              .filter((command) => command.type === type)
              .map((command) => ({
                name: `/${command.name}`,
                value: command.description,
              })),
          },
        ],
      });

      await interaction.deferUpdate({});
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "ページを更新できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "BOTの権限が不足しています",
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
}

export default HelpEvent;
