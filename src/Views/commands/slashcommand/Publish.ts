import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import {
  createPublish,
  deletePublish,
  findPublish,
  listPublishesByGuild,
} from "@/Models/Publish";

class PublishCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "server";
  public readonly name: string = "publish";
  public readonly description: string =
    "アナウンスチャンネルで送信されたメッセージを自動で公開します";
  public readonly example: string[] = ["/publish"];

  public readonly userPermission: bigint[] = [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.ManageMessages,
  ];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.ViewChannel];

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

    const publishData = await findPublish(interaction.channelId);

    if (publishData) {
      await deletePublish(interaction.channelId);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "アナウンスの自動公開を無効にしました",
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } else {
      const publishGuilds = await listPublishesByGuild(interaction.guildId);

      if (publishGuilds.length >= 6)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "アナウンスの自動公開を設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "サーバーには最大6個までしか設定できません",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if (interaction.channel.type !== ChannelType.GuildAnnouncement)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "アナウンスの自動公開を設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "設定するチャンネルはアナウンスチャンネルにしてください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      await createPublish(interaction.channelId, interaction.guildId);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "アナウンスの自動公開を設定しました",
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default PublishCommand;
