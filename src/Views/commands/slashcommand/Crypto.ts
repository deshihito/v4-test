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
import crypto from "crypto";
import CommandUtils from "@/Controllers/CommandUtils";
import toHash from "@/util/toHash";

class CryptoCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "crypto";
  public readonly description: string = "暗号を生成・復号します";
  public readonly note: string = "AES-256-ECBを使用して暗号化しています";
  public readonly example: string[] = ["/crypto 暗号化 Apple key", "/crypto 復号化 d1faf7e95c key"];

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

    const type = interaction.options.getString("type", true);
    const text = interaction.options.getString("text", true);
    const key = interaction.options.getString("key", true);

    try {
      if (type === "cipher") {
        const cipher = crypto.createCipheriv("aes-256-ecb", toHash(key), null);
        cipher.update(text, "utf8", "hex");

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "暗号を生成しました",
                icon_url: config.image.successIcon,
              },
              description: `暗号: \`\`\`${cipher.final("hex")}\`\`\`\n復号鍵: ||\`${key}\`||`,
            },
          ],
        });
      } else {
        const decipher = crypto.createDecipheriv("aes-256-ecb", toHash(key), null);
        decipher.update(text, "hex", "utf8");

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "暗号を復号しました",
                icon_url: config.image.successIcon,
              },
              description: `復号: \`\`\`${decipher.final("utf8")}\`\`\`\n復号鍵: ||\`${key}\`||`,
            },
          ],
        });
      }
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "処理できませんでした",
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
        option
          .setName("type")
          .setDescription("処理方式")
          .setRequired(true)
          .addChoices({ name: "暗号化", value: "cipher" }, { name: "復号化", value: "decipher" }),
      )
      .addStringOption((option) =>
        option.setName("text").setDescription("処理するテキスト").setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("key").setDescription("鍵").setMaxLength(32).setRequired(true),
      );
  }
}

export default CryptoCommand;
