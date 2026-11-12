import {
  Client,
  InteractionResponse,
  Colors,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import Fetch from "@/Models/Fetch";
import { findAdminByUserId, createAdmin, deleteAdminByUserId } from "@/Models/Admin";

class MemberSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "member";
  public readonly description: string = "管理者の追加/削除をします";
  public readonly example: string[] = [];

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

    const id = interaction.options.getString("id", true);

    const user = await Fetch.user(interaction.client, id);
    if (!user)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "ユーザーを取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定したユーザーが存在しません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const adminData = await findAdminByUserId(user.id);

    if (adminData) {
      await deleteAdminByUserId(user.id);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${user.displayName}(${user.id})を管理者から削除しました`,
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } else {
      await createAdmin(user.id);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${user.displayName}(${user.id})を管理者に追加しました`,
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    }
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("id").setDescription("対象のユーザーID").setRequired(true),
      );
  }
}

export default MemberSubCommand;
