import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/util/CommandUtils";
import calcTime from "@/util/calcTime";
import { prisma } from "@/Models/db";

class AfkCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "othor";
  public readonly name: string = "afk";
  public readonly description: string = "AFK(留守電)を設定します";
  public readonly example: string[] = ["/afk お出かけ中"];

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

    const message: string = interaction.options.getString("message") || "メッセージはありません";

    const afkData = await prisma.afk.findUnique({
      where: {
        userId: interaction.user.id,
      },
    });

    if (afkData) {
      await prisma.afk.delete({
        where: {
          userId: interaction.user.id,
        },
      });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "AFKを無効にしました",
              icon_url: config.image.successIcon,
            },
            description: `メンションは${afkData.mention}件ありました\n${calcTime(new Date().getTime() - afkData.createdAt.getTime())}間AFKでした`,
          },
        ],
      });
    } else {
      await prisma.afk.create({
        data: {
          userId: interaction.user.id,
          message: message,
        },
      });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "AFKを有効にしました",
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("message").setDescription("メッセージ").setMaxLength(100),
      );
  }
}

export default AfkCommand;
