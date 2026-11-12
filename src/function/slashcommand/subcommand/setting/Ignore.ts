import { Client, InteractionResponse, Colors, SlashCommandSubcommandBuilder } from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/util/CommandUtils";
import config from "@/config";
import { prisma } from "@/Models/db";

class IgnoreSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "ignore";
  public readonly description: string = "BOTの機能を無効化します";
  public readonly example: string[] = ["/setting ignore Bump通知"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: ValidSubCommandInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      interaction.options.getSubcommand() !== this.name ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const type = interaction.options.getString("type", true);

    if (type === "bump") {
      const bumpNoticeIgnoreData = await prisma.bumpNoticeIgnore.findUnique({
        where: {
          guildId: interaction.guildId,
        },
      });

      if (!bumpNoticeIgnoreData) {
        await prisma.bumpNoticeIgnore.create({
          data: {
            guildId: interaction.guildId,
          },
        });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Bump通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      } else {
        await prisma.bumpNoticeIgnore.delete({
          where: {
            guildId: interaction.guildId,
          },
        });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Bump通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      }
    } else if (type === "dissoku") {
      const dissokuNoticeIgnoreData = await prisma.dissokuNoticeIgnore.findUnique({
        where: {
          guildId: interaction.guildId,
        },
      });

      if (!dissokuNoticeIgnoreData) {
        await prisma.dissokuNoticeIgnore.create({
          data: {
            guildId: interaction.guildId,
          },
        });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Dissoku UP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      } else {
        await prisma.dissokuNoticeIgnore.delete({
          where: {
            guildId: interaction.guildId,
          },
        });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Dissoku UP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      }
    } else if (type === "up") {
      const upNoticeIgnoreData = await prisma.upNoticeIgnore.findUnique({
        where: {
          guildId: interaction.guildId,
        },
      });

      if (!upNoticeIgnoreData) {
        await prisma.upNoticeIgnore.create({
          data: {
            guildId: interaction.guildId,
          },
        });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "BOTのUP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      } else {
        await prisma.upNoticeIgnore.delete({
          where: {
            guildId: interaction.guildId,
          },
        });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "BOTのUP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      }
    } else {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "実行できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "存在しない設定です",
          },
        ],
      });
    }
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("無効化、有効化する種類")
          .setRequired(true)
          .addChoices(
            { name: "Bump通知", value: "bump" },
            { name: "Dissoku Up通知", value: "dissoku" },
            { name: "UP通知", value: "up" }
          ),
      );
  }
}

export default IgnoreSubCommand;
