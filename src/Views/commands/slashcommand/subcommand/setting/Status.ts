import { Client, InteractionResponse, Colors, SlashCommandSubcommandBuilder } from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import {
  findBumpNoticeIgnore,
  findDissokuNoticeIgnore,
  findJoinNotice,
  findLeaveNotice,
  findUpNoticeIgnore,
} from "@/Models/BoardNotice";
import { listPinsByGuild } from "@/Models/Pin";
import { listPublishesByGuild } from "@/Models/Publish";
import { v2 } from "@/util/v2";

class StatusSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "status";
  public readonly description: string = "サーバーの設定状況を確認します";
  public readonly example: string[] = ["/setting status"];

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

    const joinNoticeData = await findJoinNotice(interaction.guildId);

    const leaveNoticeData = await findLeaveNotice(interaction.guildId);

    const publishData = await listPublishesByGuild(interaction.guildId);

    const pinGuildsData = await listPinsByGuild(interaction.guildId);

    const bumpNoticeIgnoreData = await findBumpNoticeIgnore(interaction.guildId);

    const dissokuNoticeIgnoreData = await findDissokuNoticeIgnore(interaction.guildId);

    const upNoticeIgnoreData = await findUpNoticeIgnore(interaction.guildId);

    await interaction.reply(v2({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: "データベース設定状況",
            icon_url: config.image.successIcon,
          },
          fields: [
            {
              name: "参加メッセージ",
              value: joinNoticeData ? "設定済み" : "未設定",
            },
            {
              name: "退出メッセージ",
              value: leaveNoticeData ? "設定済み" : "未設定",
            },
            {
              name: "アナウンス自動公開",
              value: `${publishData.length}個設定済み`,
            },
            {
              name: "ピン",
              value: `${pinGuildsData.length}個設定済み`,
            },
            {
              name: "機能設定",
              value: `BUMP通知: ${bumpNoticeIgnoreData ? "無効" : "有効"}\nDISSOKU通知: ${dissokuNoticeIgnoreData ? "無効" : "有効"}\nUP通知: ${upNoticeIgnoreData ? "無効" : "有効"}`,
            },
          ],
        },
      ],
    }));
  }

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default StatusSubCommand;
