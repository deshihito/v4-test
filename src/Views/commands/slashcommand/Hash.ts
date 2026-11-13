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
import { createHash, Hash } from "crypto";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class HashCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "hash";
  public readonly description: string = "ハッシュを生成します";
  public readonly example: string[] = ["/hash テキスト SHA256"];

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

    const text: string = interaction.options.getString("text", true);
    const type: string = interaction.options.getString("type", true);

    try {
      const hash: Hash = createHash(type);
      hash.update(text);

      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${type.toUpperCase()}のハッシュを生成しました`,
              icon_url: config.image.successIcon,
            },
            description: hash.digest("hex"),
          },
        ],
      }));
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "ハッシュを生成できませんでした",
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
        option.setName("text").setDescription("ハッシュ化するテキスト").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("ハッシュ方式")
          .setRequired(true)
          .addChoices(
            { name: "SHA224", value: "sha224" },
            { name: "SHA256", value: "sha256" },
            { name: "SHA384", value: "sha384" },
            { name: "SHA512", value: "sha512" },
          ),
      );
  }
}

export default HashCommand;
