import {
  Client,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  InteractionResponse,
  Colors,
  AttachmentBuilder,
  RepliableInteraction,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class MiqContextMenu implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "contextmenu";
  public readonly name: string = "Make it a Quote";
  public readonly description: string = "Make it a Quoteを生成します";
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

    if (!message?.cleanContent || !message.guild)
      return await interaction.reply({
        embeds: [
          {
            author: {
              name: "生成できませんでした",
              icon_url: config.image.errorIcon,
            },
            color: Colors.Red,
            description: "メッセージの内容が存在しません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await interaction.deferReply();
    await interaction.editReply("生成中...");
    try {
      const image = await fetch(
        `${config.api.miqUrl}/?name=${encodeURIComponent(message.author.username)}&id=${message.author.id}&content=${encodeURIComponent(message.cleanContent)}&icon=${message.author.avatarURL({ extension: "png", size: 1024 }) || message.author.defaultAvatarURL}`,
      ).then((res) => res.arrayBuffer());

      await interaction.editReply({
        content: `[生成元](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`,
        files: [new AttachmentBuilder(Buffer.from(image)).setName("TakasumiBOT_MIQ.png")],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`miq_color_${interaction.user.id}_${message.id}`)
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("1131187775937458216"),
            new ButtonBuilder()
              .setCustomId(`miq_reverse_${interaction.user.id}_${message.id}`)
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("1131189335379689482"),
            new ButtonBuilder()
              .setCustomId(`miq_white_${interaction.user.id}_${message.id}`)
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("1131189576841560115"),
            new ButtonBuilder()
              .setCustomId(`miq_reverseColor_${interaction.user.id}_${message.id}`)
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("1131191439666196531"),
            new ButtonBuilder()
              .setCustomId(`miq_reverseWhite_${interaction.user.id}_${message.id}`)
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("1131190834843353158"),
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "生成できませんでした",
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

  public build(): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder()
      .setName(this.name)
      .setType(ApplicationCommandType.Message);
  }
}

export default MiqContextMenu;
