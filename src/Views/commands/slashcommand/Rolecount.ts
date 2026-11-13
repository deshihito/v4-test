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
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class RolecountCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "info";
  public readonly name: string = "rolecount";
  public readonly description: string = "それぞれのロールを持っている人数と割合を表示します";
  public readonly example: string[] = ["/rolecount"];

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

    await interaction.deferReply();
    try {
      const roles = (await interaction.guild.roles.fetch())
        .sort((r1, r2) => r2.position - r1.position)
        .filter((role) => !role.managed)
        .filter((role) => role.name !== "@everyone");

      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "ロールの人数・割合一覧",
              icon_url: config.image.successIcon,
            },
            description: roles
              .map(
                (role) =>
                  `<@&${role.id}>: ${role.members.size}人 - ${((role.members.size / interaction.guild.memberCount) * 100).toFixed(2)}%`,
              )
              .join("\n"),
          },
        ],
      }));
    } catch (error) {
      await interaction.editReply(v2({
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
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default RolecountCommand;
