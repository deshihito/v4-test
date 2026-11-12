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
import Mute from "@/Models/Mute";

class MuteSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "mute";
  public readonly description: string = "指定したユーザー/サーバー/IPをミュートします";
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

    const type: string = interaction.options.getString("type", true);
    const id: string = interaction.options.getString("id", true);
    const reason: string = interaction.options.getString("reason", true);

    if (type === "user") {
      const user = await Fetch.user(interaction.client, id);
      if (!user)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "ユーザーをミュートできませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "指定したユーザーが存在しません",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if (await Mute.isMuteUser(user.id)) {
        await Mute.deleteUser(user.id, reason);

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${user.tag}(${user.id}) のミュートを解除しました`,
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      } else {
        await Mute.addUser(user.id, reason);

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${user.tag}(${user.id}) をミュートしました`,
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      }
    } else if (type === "guild") {
      const guild = await Fetch.guild(interaction.client, id);
      if (!guild)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "サーバーをミュートできませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "指定したサーバーが存在しません",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if (await Mute.getGuild(guild.id)) {
        await Mute.deleteGuild(guild.id, reason);

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${guild.name}(${guild.id}) のミュートを解除しました`,
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      } else {
        await Mute.addGuild(guild.id, reason);

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${guild.name}(${guild.id}) をミュートしました`,
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      }
    } else if (type === "ip") {
      if (await Mute.getIp(id)) {
        await Mute.deleteIp(id, reason);

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${id} のミュートを解除しました`,
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      } else {
        await Mute.addIp(id, reason);

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${id} をミュートしました`,
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      }
    }
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("ミュートする対象")
          .setRequired(true)
          .addChoices(
            { name: "ユーザー", value: "user" },
            { name: "サーバー", value: "guild" },
            { name: "IPアドレス", value: "ip" },
          ),
      )
      .addStringOption((option) =>
        option.setName("id").setDescription("対象のID").setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("reason").setDescription("理由").setRequired(true),
      );
  }
}

export default MuteSubCommand;
