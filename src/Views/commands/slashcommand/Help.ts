import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import getParseCommands from "@/Controllers/parseCommand";
import { v2 } from "@/util/v2";

class HelpCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "othor";
  public readonly name: string = "help";
  public readonly description: string = "ヘルプを表示します";
  public readonly example: string[] = ["/help", "/help user"];

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

    const command = interaction.options.getString("command");

    if (!command) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            title: "HELP 情報",
            fields: getParseCommands()
              .filter((command) => command.type === "info")
              .map((command) => ({
                name: `/${command.name}`,
                value: command.description,
              })),
          },
        ],
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`help_${interaction.user.id}`)
              .setPlaceholder("ページを選択")
              .setMinValues(1)
              .setMaxValues(1)
              .addOptions([
                { label: "情報", value: "info" },
                { label: "サーバー関連", value: "server" },
                { label: "管理", value: "manage" },
                { label: "ツール", value: "tool" },
                { label: "検索", value: "search" },
                { label: "ネタ", value: "fun" },
                { label: "アカウント", value: "account" },
                { label: "株", value: "stock" },
                { label: "ギフト", value: "gift" },
                { label: "お金", value: "money" },
                { label: "Bot関連", value: "bot" },
                { label: "設定", value: "setting" },
                { label: "その他", value: "othor" },
                { label: "コンテキストメニュー", value: "contextmenu" },
              ]),
          ),
        ],
      }));
    } else {
      const commandData = getParseCommands().find((com) => com.name === command);

      if (!commandData)
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "コマンド・機能が存在しません",
                icon_url: config.image.errorIcon,
              },
              description: "`/help`を実行してコマンド・機能一覧を確認してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        }));

      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            title: `/${commandData.name}の使用方法`,
            description: commandData.description,
            fields: [
              {
                name: "使用例",
                value: `\`${commandData.example.join("`,`")}\``,
              },
              {
                name: "ユーザーの権限",
                value: `\`${commandData.userPermission.join("`,`")}\``,
              },
              {
                name: "BOTの権限",
                value: `\`${commandData.botPermission.join("`,`")}\``,
              },
              {
                name: "詳細情報",
                value: commandData.note,
              },
            ],
          },
        ],
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("command").setDescription("処理するテキスト").setAutocomplete(true),
      );
  }
}

export default HelpCommand;
