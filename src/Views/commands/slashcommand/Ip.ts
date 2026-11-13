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
import { IpResponse } from "@/@types/Api";
import { env } from "@/util/Env";
import { v2 } from "@/util/v2";

class IpCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "ip";
  public readonly description: string = "IPアドレスの詳細情報を表示します";
  public readonly example: string[] = ["/ip 8.8.8.8", "/ip 2001:4860:4860::8844"];

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

    const address: string = interaction.options.getString("address", true);

    if (
      !(
        address.match(
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        ) ||
        address.match(
          /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
        )
      )
    )
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "IPアドレスを指定してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    try {
      const data: IpResponse = await fetch(
        `https://api.ip2location.io/?key=${env.IP_KEY}&ip=${encodeURIComponent(address)}`,
      ).then((res) => res.json());

      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${address}の検索結果`,
              icon_url: config.image.successIcon,
            },
            fields: [
              {
                name: "国名",
                value: data.country_name,
              },
              {
                name: "地域名",
                value: data.region_name,
              },
              {
                name: "都市名",
                value: data.city_name,
              },
              {
                name: "位置",
                value: `緯度${data.latitude.toFixed(1)}度\n経度${data.longitude.toFixed(1)}度`,
              },
              {
                name: "プロバイダー",
                value: data.as,
              },
              {
                name: "プロキシ",
                value: data.is_proxy ? "使用しています" : "使用していません",
              },
            ],
          },
        ],
      }));
    } catch {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "有効なIPアドレスを指定してください",
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
        option.setName("address").setDescription("表示するIPアドレス").setRequired(true),
      );
  }
}

export default IpCommand;
