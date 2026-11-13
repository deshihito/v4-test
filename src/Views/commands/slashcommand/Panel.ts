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
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class PanelCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "panel";
  public readonly description: string = "役職パネルを作成します";
  public readonly example: string[] = ["/panel title @Role1 @Role2"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageRoles];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ManageRoles,
  ];

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

    const title = interaction.options.getString("title") || "役職パネル";

    const roles = [
      interaction.options.getRole("role_1"),
      interaction.options.getRole("role_2"),
      interaction.options.getRole("role_3"),
      interaction.options.getRole("role_4"),
      interaction.options.getRole("role_5"),
    ].filter((role) => role !== null);

    const emojis = ["🇦", "🇧", "🇨", "🇩", "🇪"];

    try {
      await interaction.channel.send(v2({
        embeds: [
          {
            color: Colors.Green,
            title: title,
            description: roles.map((role, i) => `${emojis[i]}<@&${role.id}>`).join("\n"),
          },
        ],
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("role")
              .setPlaceholder("ロールが選択されていません")
              .setMinValues(0)
              .setMaxValues(roles.length)
              .addOptions(
                roles.map((role, i) => ({
                  label: `@${role.name}`,
                  value: role.id,
                  emoji: {
                    name: emojis[i],
                  },
                })),
              ),
          ),
        ],
      }));

      await interaction.deferReply().then(() => interaction.deleteReply());
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "作成できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "同じロールが選択されているか、BOTの権限が不足しています",
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
      .addRoleOption((option) => option.setName("role_1").setDescription("役職1").setRequired(true))
      .addRoleOption((option) => option.setName("role_2").setDescription("役職2"))
      .addRoleOption((option) => option.setName("role_3").setDescription("役職3"))
      .addRoleOption((option) => option.setName("role_4").setDescription("役職4"))
      .addRoleOption((option) => option.setName("role_5").setDescription("役職5"))
      .addStringOption((option) => option.setName("title").setDescription("タイトル"));
  }
}

export default PanelCommand;
