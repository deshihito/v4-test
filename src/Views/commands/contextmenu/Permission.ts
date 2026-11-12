import {
  Client,
  RepliableInteraction,
  InteractionResponse,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import Permission from "@/util/Permission";

class PermissionContextMenu implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "contextmenu";
  public readonly name: string = "権限を表示";
  public readonly description: string = "メンバーの持っている権限を表示します";
  public readonly example: string[] = [];

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
      !interaction.isUserContextMenuCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const member = interaction.options.getMember("user");

    if (!member || !("user" in member))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "メンバーを取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定したメンバーはサーバーに存在していません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${member.user.displayName}の権限`,
              icon_url: config.image.successIcon,
            },
            description: `\`${member.permissions
              .toArray()
              .map((per) => Permission.StrToName(per))
              .join("`,`")}\``,
          },
        ],
      });
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

  public build(): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder().setName(this.name).setType(ApplicationCommandType.User);
  }
}

export default PermissionContextMenu;
