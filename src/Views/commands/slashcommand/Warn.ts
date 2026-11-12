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
  PermissionFlagsBits,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import Fetch from "@/Models/Fetch";

class WarnCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "warn";
  public readonly description: string = "メンバーを警告します";
  public readonly example: string[] = ["/warn @User"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageGuild];

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

    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    const member = await Fetch.member(interaction.guild, user.id);
    if (!member)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "警告できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定したユーザーが取得できません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (member.user.id === interaction.user.id)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "警告できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "自分自身を警告することはできません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      await member.user.send({
        embeds: [
          {
            color: Colors.Yellow,
            author: {
              name: "警告されました",
              icon_url: config.image.warnIcon,
            },
            description: reason,
            footer: {
              text: `${interaction.guild.name}(${interaction.guild.id})`,
              icon_url:
                interaction.guild.iconURL() || "https://cdn.discordapp.com/embed/avatars/0.png",
            },
          },
        ],
      });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${member.user.tag}を警告しました`,
              icon_url: config.image.successIcon,
            },
            description: `理由: ${reason}`,
          },
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "警告できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "ユーザーがDMを拒否している可能性があります",
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
      .addUserOption((option) =>
        option.setName("user").setDescription("対象のメンバー").setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("reason").setDescription("理由").setMaxLength(300).setRequired(true),
      );
  }
}

export default WarnCommand;
