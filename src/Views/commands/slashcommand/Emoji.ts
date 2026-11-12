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
  GuildEmoji,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class EmojiCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "info";
  public readonly name: string = "emoji";
  public readonly description: string = "指定した絵文字の情報を表示します";
  public readonly example: string[] = ["/emoji 🤔"];

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

    const name: string = interaction.options.getString("name", true);

    const emojiId: RegExpMatchArray | null = name.match(/<a?:[^:]+:(\d+)>/);

    if (!emojiId)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "サーバーのカスタム絵文字を指定してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      const emoji: GuildEmoji = await interaction.guild.emojis.fetch(emojiId[1]);
      const createdAt = Math.floor(emoji.createdAt.getTime() / 1000);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "絵文字の情報",
              icon_url: config.image.successIcon,
            },
            thumbnail: {
              url: `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`,
            },
            fields: [
              {
                name: "名前",
                value: emoji?.name || "設定されていません",
              },
              {
                name: "ID",
                value: emoji.id,
              },
              {
                name: "作成者",
                value: emoji?.author ? `<@${emoji.author.id}>` : `不明`,
              },
              {
                name: "種類",
                value: emoji.animated ? "アニメーション画像" : "静止画像",
              },
              {
                name: "作成日時",
                value: `<t:${createdAt}:S> (<t:${createdAt}:R>)`,
              },
            ],
          },
        ],
      });
    } catch (error) {
      await interaction.reply({
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
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("name").setDescription("絵文字名").setMaxLength(50).setRequired(true),
      );
  }
}

export default EmojiCommand;
