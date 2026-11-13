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
  Guild,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class FollowCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "bot";
  public readonly name: string = "follow";
  public readonly description: string = "BOTのアナウンスチャンネルを追加します";
  public readonly example: string[] = ["/follow アナウンス"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageChannels];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.ManageChannels];

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

    const type: string = interaction.options.getString("type", true);

    if (interaction.channel.type !== ChannelType.GuildText)
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "フォローチャンネルを追加できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "テキストチャンネルで実行してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    try {
      const guild: Guild = await interaction.client.guilds.fetch(config.announce.guildId);

      if (type === "notice") {
        await guild.channels.addFollower(config.announce.channels.noticeId, interaction.channel);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "フォローチャンネルを追加しました",
                icon_url: config.image.successIcon,
              },
              description: "このチャンネルでBOTのお知らせを受け取ることができます",
            },
          ],
        }));
      } else if (type === "update") {
        await guild.channels.addFollower(config.announce.channels.updateId, interaction.channel);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "フォローチャンネルを追加しました",
                icon_url: config.image.successIcon,
              },
              description: "このチャンネルでBOTの変更ログを受け取ることができます",
            },
          ],
        }));
      }
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "フォローチャンネルを追加できませんでした",
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
        flags: MessageFlags.Ephemeral,
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("設定する種類")
          .setRequired(true)
          .addChoices(
            { name: "アナウンス", value: "notice" },
            { name: "変更ログ", value: "update" },
          ),
      );
  }
}

export default FollowCommand;
