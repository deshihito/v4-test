import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  Message,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { MCServerResponse } from "@/@types/Api";

class McCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "mc";
  public readonly description: string = "Minecraftサーバーの情報を表示します";
  public readonly example: string[] = ["/mc Java版 2b2t.jp"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | Message | void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const address = interaction.options.getString("address", true);
    const edition = interaction.options.getString("edition", true);

    await interaction.deferReply();
    try {
      if (edition === "je") {
        const server: MCServerResponse = await fetch(
          `https://api.mcsrvstat.us/2/${encodeURIComponent(address)}`,
        ).then((res) => res.json());

        if (!server.online)
          return await interaction.editReply({
            embeds: [
              {
                color: Colors.Green,
                title: address,
                url: `https://mcsrvstat.us/server/${address}`,
                thumbnail: {
                  url: `https://api.mcsrvstat.us/icon/${address}`,
                },
                description: "🔴 オフライン",
              },
            ],
          });

        if (!server.debug.ping)
          return await interaction.editReply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "取得できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "無効なホスト名です",
              },
            ],
          });

        await interaction.editReply({
          embeds: [
            {
              color: Colors.Green,
              title: address,
              url: `https://mcsrvstat.us/server/${address}`,
              thumbnail: {
                url: `https://api.mcsrvstat.us/icon/${address}`,
              },
              description: "🟢 オンライン",
              fields: [
                {
                  name: "MOTD",
                  value: `\`\`\`${server.motd ? server.motd.clean.join("\n") : "なし"}\`\`\``,
                  inline: true,
                },
                {
                  name: "プレイヤー",
                  value: `${server.players.online}/${server.players.max}`,
                  inline: true,
                },
                {
                  name: "バージョン",
                  value: server.version,
                  inline: true,
                },
                {
                  name: "アドレス",
                  value: `${server.ip}:${server.port}`,
                  inline: true,
                },
                {
                  name: "ソフトウェア",
                  value: server.software,
                  inline: true,
                },
              ],
            },
          ],
        });
      } else {
        const server: MCServerResponse = await fetch(
          `https://api.mcsrvstat.us/bedrock/2/${encodeURIComponent(address)}`,
        ).then((res) => res.json());

        if (!server.online)
          return await interaction.editReply({
            embeds: [
              {
                color: Colors.Green,
                title: address,
                url: `https://mcsrvstat.us/server/${address}`,
                thumbnail: {
                  url: `https://api.mcsrvstat.us/icon/${address}`,
                },
                description: "🔴 オフライン",
              },
            ],
          });

        if (!server.debug.ping)
          return await interaction.editReply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "取得できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description: "無効なホスト名です",
              },
            ],
          });

        await interaction.editReply({
          embeds: [
            {
              color: Colors.Green,
              title: address,
              url: `https://mcsrvstat.us/bedrock/${address}`,
              thumbnail: {
                url: `https://api.mcsrvstat.us/icon/${address}`,
              },
              description: "🟢 オンライン",
              fields: [
                {
                  name: "MOTD",
                  value: `\`\`\`${server.motd ? server.motd.clean.join("\n") : "なし"}\`\`\``,
                  inline: true,
                },
                {
                  name: "プレイヤー",
                  value: `${server.players.online}/${server.players.max}`,
                  inline: true,
                },
                {
                  name: "バージョン",
                  value: server.version,
                  inline: true,
                },
                {
                  name: "アドレス",
                  value: `${server.ip}:${server.port}`,
                  inline: true,
                },
                {
                  name: "ソフトウェア",
                  value: server.software,
                  inline: true,
                },
              ],
            },
          ],
        });
      }
    } catch {
      await interaction.editReply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "指定したアドレスが間違っている可能性があります",
          },
        ],
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("edition")
          .setDescription("エディション")
          .setRequired(true)
          .addChoices({ name: "Java版", value: "je" }, { name: "統合版", value: "be" }),
      )
      .addStringOption((option) =>
        option.setName("address").setDescription("サーバーアドレス").setRequired(true),
      );
  }
}

export default McCommand;
