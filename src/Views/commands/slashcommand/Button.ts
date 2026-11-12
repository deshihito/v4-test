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
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import isUrl from "@/util/isUrl";
import CommandUtils from "@/Controllers/CommandUtils";

class ButtonCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "button";
  public readonly description: string = "URLのボタンを生成します";
  public readonly example: string[] = ["/button ボタン https://google.com"];

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

    const name = interaction.options.getString("name", true);
    const url = interaction.options.getString("url", true);

    if (!isUrl(url))
      return await interaction.reply({
        embeds: [
          {
            author: {
              name: "作成できませんでした",
              icon_url: config.image.errorIcon,
            },
            color: Colors.Red,
            description: "URLを指定する必要があります",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      await interaction.reply({
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel(name).setURL(url).setStyle(ButtonStyle.Link),
          ),
        ],
      });
    } catch {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "作成できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "有効なURLを指定してください",
          },
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
        option.setName("name").setDescription("ボタンの名前").setRequired(true).setMaxLength(30),
      )
      .addStringOption((option) =>
        option.setName("url").setDescription("ボタンのURL").setRequired(true),
      );
  }
}

export default ButtonCommand;
