import { Client, InteractionResponse, Colors, SlashCommandSubcommandBuilder } from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import {
  createBumpNoticeIgnore,
  createDissokuNoticeIgnore,
  createUpNoticeIgnore,
  deleteBumpNoticeIgnore,
  deleteDissokuNoticeIgnore,
  deleteUpNoticeIgnore,
  findBumpNoticeIgnore,
  findDissokuNoticeIgnore,
  findUpNoticeIgnore,
  createVoteNoticeIgnore,
  deleteVoteNoticeIgnore,
  findVoteNoticeIgnore,
  createDicoallNoticeIgnore,
  deleteDicoallNoticeIgnore,
  findDicoallNoticeIgnore,
  createDcafeNoticeIgnore,
  deleteDcafeNoticeIgnore,
  findDcafeNoticeIgnore,
  createSharkbotNoticeIgnore,
  deleteSharkbotNoticeIgnore,
  findSharkbotNoticeIgnore,
  createDsioNoticeIgnore,
  deleteDsioNoticeIgnore,
  findDsioNoticeIgnore,
  createDiscomNoticeIgnore,
  deleteDiscomNoticeIgnore,
  findDiscomNoticeIgnore,
} from "@/Models/BoardNotice";
import { v2 } from "@/util/v2";

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
      const bumpNoticeIgnoreData = await findBumpNoticeIgnore(interaction.guildId);

      if (!bumpNoticeIgnoreData) {
        await createBumpNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Bump通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteBumpNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Bump通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else if (type === "dissoku") {
      const dissokuNoticeIgnoreData = await findDissokuNoticeIgnore(interaction.guildId);

      if (!dissokuNoticeIgnoreData) {
        await createDissokuNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Dissoku UP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteDissokuNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Dissoku UP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else if (type === "up") {
      const upNoticeIgnoreData = await findUpNoticeIgnore(interaction.guildId);

      if (!upNoticeIgnoreData) {
        await createUpNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "BOTのUP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteUpNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "BOTのUP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else if (type === "vote") {
      const voteNoticeIgnoreData = await findVoteNoticeIgnore(interaction.guildId);

      if (!voteNoticeIgnoreData) {
        await createVoteNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "鯖ちゃんねる Vote通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteVoteNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "鯖ちゃんねる Vote通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else if (type === "dicoall") {
      const dicoallNoticeIgnoreData = await findDicoallNoticeIgnore(interaction.guildId);

      if (!dicoallNoticeIgnoreData) {
        await createDicoallNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Dicoall UP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteDicoallNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Dicoall UP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else if (type === "dcafe") {
      const dcafeNoticeIgnoreData = await findDcafeNoticeIgnore(interaction.guildId);

      if (!dcafeNoticeIgnoreData) {
        await createDcafeNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Discord Cafe UP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteDcafeNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "Discord Cafe UP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else if (type === "sharkbot") {
      const sharkbotNoticeIgnoreData = await findSharkbotNoticeIgnore(interaction.guildId);

      if (!sharkbotNoticeIgnoreData) {
        await createSharkbotNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "SharkBot UP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteSharkbotNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "SharkBot UP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else if (type === "dsio") {
      const dsioNoticeIgnoreData = await findDsioNoticeIgnore(interaction.guildId);

      if (!dsioNoticeIgnoreData) {
        await createDsioNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "DiscordServers.io BUMP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteDsioNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "DiscordServers.io BUMP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else if (type === "discom") {
      const discomNoticeIgnoreData = await findDiscomNoticeIgnore(interaction.guildId);

      if (!discomNoticeIgnoreData) {
        await createDiscomNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "DISCOM UP通知を無効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      } else {
        await deleteDiscomNoticeIgnore(interaction.guildId);

        await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "DISCOM UP通知を有効にしました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        }));
      }
    } else {
      await interaction.reply(v2({
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
      }));
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
            { name: "UP通知", value: "up" },
            { name: "鯖ちゃんねる Vote通知", value: "vote" },
            { name: "Dicoall UP通知", value: "dicoall" },
            { name: "Discord Cafe UP通知", value: "dcafe" },
            { name: "SharkBot UP通知", value: "sharkbot" },
            { name: "DiscordServers.io BUMP通知", value: "dsio" },
            { name: "DISCOM UP通知", value: "discom" }
          ),
      );
  }
}

export default IgnoreSubCommand;
