import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import isUrl from "@/util/isUrl";
import isTimePassed from "@/Models/isTimePassed";
import { v2 } from "@/util/v2";

class ShortCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "short";
  public readonly description: string = "短縮URLを作成します";
  public readonly note: string = "使用には10秒のクールタイムがあります";
  public readonly example: string[] = ["/short https://google.com"];

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

    const url: string = interaction.options.getString("url", true);

    if (!isUrl(url))
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "短縮URLにできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "URLを指定する必要があります",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    if (!(await isTimePassed(interaction.user.id, this.name, 10)))
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "短縮URLにできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "10秒間に1回しか実行できません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    try {
      const data = await fetch("https://short.neody.land/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
      }).then((res) => res.json());

      await interaction.reply({
        content: data.shorturl,
      });
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "短縮URLにできませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "URLが無効又はシステム管理者によって無効にされているURLです",
            fields: [
              {
                name: "エラーコード",
                value: `\`\`\`${error}\`\`\``,
              },
            ],
          },
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
        option.setName("url").setDescription("短縮するURL").setRequired(true),
      );
  }
}

export default ShortCommand;
