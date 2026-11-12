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
import CommandUtils from "@/Controllers/CommandUtils";
import matchId from "@/util/matchId";
import Fetch from "@/Models/Fetch";

class AvatarCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "info";
  public readonly name: string = "avatar";
  public readonly description: string = "ユーザーのアイコンを表示します";
  public readonly example: string[] = ["/avatar @User", "/avatar 9813146955437836999"];

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

    const id: string | null = interaction.options.getString("id");

    try {
      if (!id) {
        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${interaction.user.displayName}のアバター`,
                icon_url: config.image.successIcon,
              },
              thumbnail: {
                url: interaction.member.avatarURL({ extension: "png", size: 1024 }) || "",
              },
              image: {
                url:
                  interaction.user.avatarURL({ extension: "png", size: 1024 }) ||
                  interaction.user.defaultAvatarURL,
              },
            },
          ],
        });
      } else {
        const userId = matchId(id);
        if (!userId)
          return await interaction.reply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "取得できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "ユーザーID、メンションを入力してください",
              },
            ],
            flags: MessageFlags.Ephemeral,
          });

        const user = await Fetch.user(this.client, userId);
        const member = await Fetch.member(interaction.guild, userId);
        if (!user)
          return await interaction.reply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "取得できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "指定されたユーザーが存在しません",
              },
            ],
            flags: MessageFlags.Ephemeral,
          });

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${user.displayName}のアバター`,
                icon_url: config.image.successIcon,
              },
              thumbnail: {
                url: member?.avatarURL({ extension: "png", size: 1024 }) || "",
              },
              image: {
                url: user.avatarURL({ extension: "png", size: 1024 }) || user.defaultAvatarURL,
              },
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
              name: "取得できませんでした",
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
        option.setName("id").setDescription("ユーザーID・メンション").setMaxLength(50),
      );
  }
}

export default AvatarCommand;
