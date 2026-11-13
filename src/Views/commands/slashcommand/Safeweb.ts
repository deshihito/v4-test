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
import { SafewebResponse } from "@/@types/Api";
import isUrl from "@/util/isUrl";
import { v2 } from "@/util/v2";

class SafewebCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "safeweb";
  public readonly description: string = "Webサイトの安全性を評価します";
  public readonly example: string[] = ["/safeweb https://google.com/"];

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

    const url = interaction.options.getString("url", true);

    if (!isUrl(url))
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "評価できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "URLを指定する必要があります",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    await interaction.deferReply();
    try {
      const data: SafewebResponse = await fetch(
        `https://safeweb.norton.com/safeweb/sites/v1/details?url=${encodeURIComponent(url)}&insert=0`,
      ).then((res) => res.json());

      if (data.rating === "w") {
        await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Yellow,
              author: {
                name: "このサイトは注意が必要です",
                icon_url: config.image.warnIcon,
                url: `https://safeweb.norton.com/report/show?url=${encodeURIComponent(url)}&ulang=jpn`,
              },
              description: `注意の評価を受けた Web サイトは少数の脅威または迷惑を伴いますが、\n警告に相当するほど危険とは見なされません。サイトにアクセスする場合には注意が必要です。\n\n※注意の評価は、誤判定の可能性があります`,
              footer: {
                text: "Norton Safeweb",
              },
            },
          ],
        }));
      } else if (data.rating === "b") {
        await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "このサイトは危険です",
                icon_url: config.image.errorIcon,
                url: `https://safeweb.norton.com/report/show?url=${encodeURIComponent(url)}&ulang=jpn`,
              },
              description: `これは既知の危険なWebサイトです。\nこのページを表示しないことを推奨します。\nコミュニティースコア: ${data.communityRating}`,
              footer: {
                text: "Norton Safeweb",
              },
            },
          ],
        }));
      } else if (data.rating === "u") {
        await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Grey,
              author: {
                name: "このサイトは評価されていません",
                icon_url: config.image.configIcon,
                url: `https://safeweb.norton.com/report/show?url=${encodeURIComponent(url)}&ulang=jpn`,
              },
              description: `サイトは未評価のため、接続には注意が必要な可能性があります\nコミュニティースコア: ${data.communityRating}`,
              footer: {
                text: "Norton Safeweb",
              },
            },
          ],
        }));
      } else {
        await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "このサイトは安全です",
                icon_url: config.image.successIcon,
                url: `https://safeweb.norton.com/report/show?url=${encodeURIComponent(url)}&ulang=jpn`,
              },
              description: `サイトからは脅威が確認されませんでした。\n安全に接続が可能です\nコミュニティースコア: ${data.communityRating}`,
              footer: {
                text: "Norton Safeweb",
              },
            },
          ],
        }));
      }
    } catch {
      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "評価できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "サイトの取得に失敗しました",
          },
        ],
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("url").setDescription("対象のURL").setRequired(true),
      );
  }
}

export default SafewebCommand;
