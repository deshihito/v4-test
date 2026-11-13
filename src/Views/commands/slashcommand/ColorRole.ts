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
import { v2 } from "@/util/v2";

class ColorRoleCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "colorrole";
  public readonly description: string = "指定した色のロールを作成します";
  public readonly example: string[] = ["/colorrole ロール名 赤"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageRoles];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.ManageRoles];

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

    const name = interaction.options.getString("name", true);
    const color = interaction.options.getString("color", true);

    try {
      const role = await interaction.guild.roles.create({
        name: name,
        color: Number(color),
        position: interaction.guild.members.me.roles.highest.position,
        mentionable: false,
      });

      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "ロールを作成しました",
              icon_url: config.image.successIcon,
            },
            description: `作成したロール: ${role}`,
          },
        ],
      }));
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "作成できませんでした",
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
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("name").setDescription("ロールの名前").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("color")
          .setDescription("ロールの色")
          .setRequired(true)
          .addChoices(
            { name: "白色", value: `${Colors.White}` },
            { name: "緑色", value: `${Colors.Green}` },
            { name: "青色", value: `${Colors.Blue}` },
            { name: "黄色", value: `${Colors.Yellow}` },
            { name: "紫色", value: `${Colors.Purple}` },
            { name: "金色", value: `${Colors.Gold}` },
            { name: "橙色", value: `${Colors.Orange}` },
            { name: "赤色", value: `${Colors.Red}` },
            { name: "黒色", value: `${Colors.NotQuiteBlack}` },
            { name: "Discord", value: "0x5865F2" },
          ),
      );
  }
}

export default ColorRoleCommand;
