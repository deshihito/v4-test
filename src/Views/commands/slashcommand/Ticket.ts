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
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class Ticketommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "ticket";
  public readonly description: string = "チケット機能を作成します";
  public readonly example: string[] = ["/ticket #Category", "/ticket #Category Title Description"];

  public readonly userPermission: bigint[] = [
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageChannels,
  ];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ManageChannels,
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

    const channel = interaction.options.getChannel<ChannelType.GuildCategory>("channel", true);
    const title = interaction.options.getString("title") || "チケット";
    const description =
      interaction.options.getString("description") || "チケットの発行は下のボタンを押してください";

    try {
      await interaction.channel.send(v2({
        embeds: [
          {
            color: Colors.Green,
            title: title,
            description: description,
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`ticket_${channel.id}`)
              .setStyle(ButtonStyle.Primary)
              .setLabel("作成"),
          ),
        ],
      }));

      await interaction.deferReply().then(() => interaction.deleteReply());
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "チケットが作成出来ませんでした",
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
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("作成するカテゴリー")
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(true),
      )
      .addStringOption((option) => option.setName("title").setDescription("タイトル"))
      .addStringOption((option) => option.setName("description").setDescription("説明"));
  }
}

export default Ticketommand;
