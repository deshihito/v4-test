import {
  Client,
  InteractionResponse,
  Colors,
  SlashCommandSubcommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import Fetch from "@/Models/Fetch";
import { prisma } from "@/Models/db";

class BumpSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "bump";
  public readonly description: string = "Bump通知時にメンションするロールを設定します";
  public readonly example: string[] = ["/setting bump @通知"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
  ];

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

    const role = interaction.options.getRole("role");

    const bumpNoticeData = await prisma.bumpNotice.findUnique({
      where: {
        guildId: interaction.guildId,
      },
    });

    if (!bumpNoticeData) {
      if (!role)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "ロールを選択してください",
            },
          ],
        });

      const botData = await Fetch.member(interaction.guild, "302050872383242240");
      if (!botData)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "このサーバーにDisboardが参加していません",
            },
          ],
        });

      await prisma.bumpNotice.create({
        data: {
          guildId: interaction.guildId,
          roleId: role.id,
        },
      });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "通知するロールを設定しました",
              icon_url: config.image.successIcon,
            },
            description: `<@&${role.id}>`,
          },
        ],
      });
    } else {
      if (role) {
        const botData = await Fetch.member(interaction.guild, config.bot.disboardId);
        if (!botData)
          return await interaction.reply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "設定できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "このサーバーにDisboardが参加していません",
              },
            ],
          });

        await prisma.bumpNotice.upsert({
          where: {
            guildId: interaction.guildId,
          },
          update: {
            roleId: role.id,
          },
          create: {
            guildId: interaction.guildId,
            roleId: role.id,
          },
        });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "通知するロールを設定しました",
                icon_url: config.image.successIcon,
              },
              description: `<@&${role.id}>`,
            },
          ],
        });
      } else {
        await prisma.bumpNotice.delete({
          where: {
            guildId: interaction.guildId,
          },
        });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "通知するロールを削除しました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      }
    }
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addRoleOption((option) => option.setName("role").setDescription("通知するロール"));
  }
}

export default BumpSubCommand;
