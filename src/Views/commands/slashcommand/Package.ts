import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { npmPackageResponse, PypiPackageResponse } from "@/@types/Api";
import { v2 } from "@/util/v2";

class PackageCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "search";
  public readonly name: string = "package";
  public readonly description: string = "パッケージを検索して表示します";
  public readonly example: string[] = ["/package NPM discord.js", "/package PYPI discord.py"];

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

    const type = interaction.options.getString("type", true);
    const name = interaction.options.getString("name", true);

    await interaction.deferReply();
    try {
      if (type === "npm") {
        const res: npmPackageResponse = await fetch(
          `https://api.npms.io/v2/search?q=${encodeURIComponent(name)}`,
        ).then((res) => res.json());

        const pkg = res.results[0].package;

        await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Green,
              title: `NPM: ${pkg.name}`,
              url: pkg.links.npm,
              description: pkg.description,
              thumbnail: {
                url: config.image.npmIcon,
              },
              fields: [
                {
                  name: "作者",
                  value: pkg.author ? pkg.author.name : "なし",
                  inline: true,
                },
                {
                  name: "バージョン",
                  value: pkg.version,
                  inline: true,
                },
                {
                  name: "リポジトリ",
                  value: pkg.links.repository ? pkg.links.repository : "なし",
                  inline: true,
                },
                {
                  name: "キーワード",
                  value: pkg.keywords ? pkg.keywords.join(", ") : "なし",
                  inline: true,
                },
              ],
            },
          ],
        }));
      } else if (type === "pypi") {
        const pkg: PypiPackageResponse = await fetch(
          `https://pypi.org/pypi/${encodeURIComponent(name)}/json`,
        ).then((res) => res.json());

        await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Green,
              title: `PYPI: ${pkg.info.name}`,
              url: pkg.info.package_url,
              description: pkg.info.summary,
              thumbnail: {
                url: config.image.pypiIcon,
              },
              fields: [
                {
                  name: "作者",
                  value: pkg.info.author ? pkg.info.author : "なし",
                  inline: true,
                },
                {
                  name: "バージョン",
                  value: pkg.info.version,
                  inline: true,
                },
                {
                  name: "リポジトリ",
                  value: pkg.info.project_urls.source ? pkg.info.project_urls.source : "なし",
                  inline: true,
                },
                {
                  name: "ライセンス",
                  value: pkg.info.license ? pkg.info.license : "なし",
                  inline: true,
                },
                {
                  name: "キーワード",
                  value: pkg.info.keywords ? pkg.info.keywords : "なし",
                  inline: true,
                },
              ],
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
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "検索ワードを変えてやり直してください",
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
        option
          .setName("type")
          .setDescription("検索するパッケージマネージャー")
          .setRequired(true)
          .addChoices({ name: "NPM", value: "npm" }, { name: "PYPI", value: "pypi" }),
      )
      .addStringOption((option) =>
        option.setName("name").setDescription("検索ワード").setRequired(true),
      );
  }
}

export default PackageCommand;
