import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import os from "os";
import process from "process";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { env } from "@/util/Env";
import calcTime from "@/util/calcTime";
import { v2 } from "@/util/v2";

class StatusCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "bot";
  public readonly name: string = "status";
  public readonly description: string = "BOTのステータスを表示します";
  public readonly example: string[] = ["/status"];

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
      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Blue,
            description: "計測中...",
          },
        ],
      }));

      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Blue,
            title: "ステータス",
            fields: [
              {
                name: "システム",
                value: `マシン${env.MACHINE_ID}稼働時間: ${calcTime(os.uptime() * 1000)}\n(BOT: ${calcTime(process.uptime() * 1000)})`,
              },
              {
                name: "Discord",
                value: `Ping: ${interaction.client.ws.ping}ミリ秒\nコマンド数: ${(await interaction.client.application.commands.fetch()).size}個\n`,
              },
            ],
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("ステータスサイト")
              .setURL("https://status.takasumibot.com/")
              .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
              .setLabel("サポートサーバー")
              .setURL(config.inviteUrl)
              .setStyle(ButtonStyle.Link),
          ),
        ],
      }));
    } catch (error) {
      await interaction.editReply(v2({
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
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default StatusCommand;
