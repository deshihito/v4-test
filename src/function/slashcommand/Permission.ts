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
import CommandUtils from "@/util/CommandUtils";
import Permission from "@/util/Permission";
import Fetch from "@/Models/Fetch";

class PermissionCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "info";
  public readonly name: string = "permission";
  public readonly description: string = "ユーザーの権限を表示します";
  public readonly example: string[] = ["/permission @User"];

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

    const user = interaction.options.getUser("user");

    try {
      if (!user) {
        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${interaction.user.displayName}の権限`,
                icon_url: config.image.successIcon,
              },
              description: `\`${interaction.member.permissions
                .toArray()
                .map((per) => Permission.StrToName(per))
                .join("`,`")}\``,
            },
          ],
        });
      } else {
        const member = await Fetch.member(interaction.guild, user.id);
        if (!member)
          return await interaction.reply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "権限を取得できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "指定したユーザーがサーバーに存在しません",
              },
            ],
            flags: MessageFlags.Ephemeral,
          });

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
      }
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "権限を取得できませんでした",
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
      .addUserOption((option) => option.setName("user").setDescription("表示するユーザー"));
  }
}

export default PermissionCommand;
