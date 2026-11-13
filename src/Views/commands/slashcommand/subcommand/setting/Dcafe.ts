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
import {
  createDcafeNotice,
  deleteDcafeNotice,
  findDcafeNotice,
  upsertDcafeNotice,
} from "@/Models/BoardNotice";
import { v2 } from "@/util/v2";

class DcafeSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "dcafe";
  public readonly description: string = "Discord Cafe UP通知時にメンションするロールを設定します";
  public readonly example: string[] = ["/setting dcafe @通知"];

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

    const dcafeNoticeData = await findDcafeNotice(interaction.guildId);

    if (!dcafeNoticeData) {
      if (!role)
        return await interaction.reply(v2({
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
        }));

      const botData = await Fetch.member(interaction.guild, config.bot.dcafeId);
      if (!botData)
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "このサーバーにDiscord Cafeが参加していません",
            },
          ],
        }));

      await createDcafeNotice(interaction.guildId, role.id);

      await interaction.reply(v2({
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
      }));
    } else {
      if (role) {
        const botData = await Fetch.member(interaction.guild, config.bot.dcafeId);
        if (!botData)
          return await interaction.reply(v2({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "設定できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "このサーバーにDiscord Cafeが参加していません",
              },
            ],
          }));

        await upsertDcafeNotice(interaction.guildId, role.id);

        await interaction.reply(v2({
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
        }));
      } else {
        await deleteDcafeNotice(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "通知するロールを削除しました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
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

export default DcafeSubCommand;
