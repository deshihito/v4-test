import {
  Client,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  InteractionResponse,
  Colors,
  RepliableInteraction,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import translate from "@/Models/translate";

class ToEnContextMenu implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "contextmenu";
  public readonly name: string = "英語に翻訳";
  public readonly description: string = "メッセージを英語に翻訳します";
  public readonly example: string[] = [];

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
      !interaction.isMessageContextMenuCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const message = interaction.options.getMessage("message");

    if (!message?.cleanContent || !message?.guild)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "翻訳できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "メッセージの内容が存在しません",
            footer: {
              text: "Google Translate",
              icon_url: config.image.translateIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (message.cleanContent.length > 2000)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "翻訳できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "翻訳文字数は2000文字以下です",
            footer: {
              text: "Google Translate",
              icon_url: config.image.translateIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await interaction.deferReply();
    await interaction.editReply("生成中...");
    try {
      const data = await translate(message.cleanContent, "auto", "en");

      await interaction.editReply({
        content: `[翻訳元](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}/)`,
        embeds: [
          {
            color: Colors.Blue,
            author: {
              name: `${message.author.tag}`,
              icon_url: message.author.avatarURL() || message.author.defaultAvatarURL,
            },
            description: data.text,
            footer: {
              text: `Google Translate [${data.source}]->[en]`,
              icon_url: config.image.translateIcon,
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
              name: "翻訳できませんでした",
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
      });
    }
  }

  public build(): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder()
      .setName(this.name)
      .setType(ApplicationCommandType.Message);
  }
}

export default ToEnContextMenu;
