import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class TopCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "server";
  public readonly name: string = "top";
  public readonly description: string = "チャンネルの最初のメッセージのリンクを表示します";
  public readonly example: string[] = ["/top", "/top #雑談"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.ViewChannel,
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

    const channel = interaction.options.getChannel("channel");

    await interaction.deferReply();
    await interaction.editReply(v2({
      embeds: [
        {
          color: Colors.Green,
          description: "取得中...",
        },
      ],
    }));

    if (channel) {
      if (!("messages" in channel))
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "取得できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "権限が不足しています",
            },
          ],
          flags: MessageFlags.Ephemeral,
        }));

      const msg = (await channel.messages.fetch({ after: "0", limit: 1 })).first();
      if (!msg)
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "取得できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "権限が不足しています",
            },
          ],
          flags: MessageFlags.Ephemeral,
        }));

      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Green,
            title: `${channel.name}の最初のメッセージ`,
            description: "下のリンクから飛べます",
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("メッセージへ飛ぶ")
              .setURL(msg.url)
              .setStyle(ButtonStyle.Link),
          ),
        ],
      }));
    } else {
      const msg = (await interaction.channel.messages.fetch({ after: "0", limit: 1 })).first();
      if (!msg)
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "取得できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "権限が不足しています",
            },
          ],
          flags: MessageFlags.Ephemeral,
        }));

      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Green,
            title: "最初のメッセージ",
            description: "下のリンクから飛べます",
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("メッセージへ飛ぶ")
              .setURL(msg.url)
              .setStyle(ButtonStyle.Link),
          ),
        ],
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addChannelOption((option) => option.setName("channel").setDescription("表示するチャンネル"));
  }
}

export default TopCommand;
