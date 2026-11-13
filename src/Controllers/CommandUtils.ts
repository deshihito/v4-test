import {
  Colors,
  ChatInputCommandInteraction,
  Client,
  MessageFlags,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { Command, SubCommand, ValidCommandInteraction } from "@/@types/Util";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import Permission from "@/util/Permission";
import Log from "@/util/Log";
import config from "@/config";
import { v2 } from "@/util/v2";

class CommandUtils {
  public static async hasPermissions(
    command: Command | SubCommand,
    interaction: ValidCommandInteraction,
  ): Promise<boolean> {
    const requiredUserPermission: bigint[] = command.userPermission.filter(
      (per) => !interaction.member.permissions.has(per),
    );
    if (requiredUserPermission.length !== 0) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "権限がありません",
              icon_url: config.image.errorIcon,
            },
            description: "このコマンドを実行するには以下の権限が不足しています",
            fields: [
              {
                name: "不足している権限",
                value: `\`\`\`${requiredUserPermission.map((per) => Permission.IntToName(per)).join("\n")}\`\`\``,
              },
            ],
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

      return false;
    }

    const requiredBotPermission: bigint[] = command.botPermission.filter(
      (per) => !interaction.guild.members.me.permissionsIn(interaction.channelId).has(per),
    );
    if (requiredBotPermission.length !== 0) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "BOTに権限がありません",
              icon_url: config.image.errorIcon,
            },
            description: "このコマンドを実行するにはBOTに以下の権限が不足しています",
            fields: [
              {
                name: "不足している権限",
                value: `\`\`\`${requiredBotPermission.map((per) => Permission.IntToName(per)).join("\n")}\`\`\``,
              },
            ],
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

      return false;
    }

    return true;
  }

  public static isVaild(
    interaction:
      | ChatInputCommandInteraction
      | MessageContextMenuCommandInteraction
      | UserContextMenuCommandInteraction,
  ): interaction is ValidCommandInteraction {
    return Boolean(
      interaction.guildId &&
      interaction.channelId &&
      interaction.member &&
      interaction.guild &&
      interaction.channel &&
      interaction.guild.members.me &&
      typeof interaction.member.permissions !== "string",
    );
  }

  private static async getSubCommandFiles(dir: string): Promise<string[]> {
    // サブコマンドを持たないコマンド (optout 等) はディレクトリ自体が無い
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir, { withFileTypes: true });
    const fileList: string[] = [];

    await Promise.all(
      files.map((file) => {
        const filePath = path.join(dir, file.name);
        if (filePath.endsWith(".ts")) {
          fileList.push(filePath);
        }
      }),
    );

    return fileList;
  }

  public static async loadSubCommand(client: Client, commandName: string): Promise<SubCommand[]> {
    const commands: SubCommand[] = [];

    for (const filePath of await this.getSubCommandFiles(
      `./src/Views/commands/slashcommand/subcommand/${commandName}`,
    )) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as { default: new (client: Client) => SubCommand };
      commands.push(new module.default(client));
    }

    Log.debug(`${commandName}のサブコマンドをロードしました`);

    return commands;
  }
}

export default CommandUtils;
