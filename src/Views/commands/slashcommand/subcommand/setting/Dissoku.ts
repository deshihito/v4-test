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

class DissokuSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "dissoku";
  public readonly description: string = "Dissoku Up通知時にメンションするロールを設定します";
  public readonly example: string[] = ["/setting dissoku @通知"];

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

    const dissokuNoticeData = await prisma.dissokuNotice.findUnique({
      where: {
        guildId: interaction.guildId,
      },
    });

    if (!dissokuNoticeData) {
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

      const botData = await Fetch.member(interaction.guild, config.bot.dissokuId);
      if (!botData)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "このサーバーにDissokuが参加していません",
            },
          ],
        });

      await prisma.dissokuNotice.create({
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
        const botData = await Fetch.member(interaction.guild, "761562078095867916");
        if (!botData)
          return await interaction.reply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "設定できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "このサーバーにDissokuが参加していません",
              },
            ],
          });

        await prisma.dissokuNotice.upsert({
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
        await prisma.dissokuNotice.delete({
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

export default DissokuSubCommand;
