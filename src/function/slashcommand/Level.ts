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
import CommandUtils from "@/util/CommandUtils";
import { prisma } from "@/util/db";
import calcLevel from "@/util/calcLevel";

class LevelCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "account";
  public readonly name: string = "level";
  public readonly description: string = "自分のレベルを表示します";
  public readonly example: string[] = ["/level"];

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

    const data = await prisma.levelUser.findUnique({
      where: {
        userId_guildId: {
          userId: interaction.user.id,
          guildId: interaction.guild.id,
        },
      },
    });

    if (!data) {
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Yellow,
            author: {
              name: "レベルデータがありません",
              icon_url: config.image.warnIcon,
            },
            description: "サーバーで発言するとEXPが貯まります",
          },
        ],
      });
    }

    const { level, current, next } = calcLevel(data.chatExp);

    const serverRank =
      (await prisma.levelUser.count({
        where: {
          guildId: interaction.guild.id,
          chatExp: { gt: data.chatExp },
        },
      })) + 1;

    // 全体順位はユーザーごとの全サーバー合計同士で比べる。
    // 集計は DB 側で完結させ、全行をメモリに読み込まない。
    const totalRows = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("chatExp"), 0)::int AS "total"
      FROM "levelUser"
      WHERE "userId" = ${interaction.user.id}`;
    const totalExp: number = totalRows[0]?.total ?? data.chatExp;

    const rankRows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS "count"
      FROM (
        SELECT "userId"
        FROM "levelUser"
        GROUP BY "userId"
        HAVING SUM("chatExp") > ${totalExp}
      ) AS "totals"`;
    const globalRank: number = (rankRows[0]?.count ?? 0) + 1;

    const filled = Math.min(12, Math.floor((current / next) * 12));
    const bar = "█".repeat(filled) + "░".repeat(12 - filled);

    await interaction.reply({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: `${interaction.user.displayName}のレベル`,
            icon_url: config.image.successIcon,
          },
          description: `**Lv.${level}**\n${bar} ${current}/${next} EXP`,
          fields: [
            {
              name: "総EXP",
              value: `${totalExp}`,
              inline: true,
            },
            {
              name: "サーバー内順位",
              value: `${serverRank}位`,
              inline: true,
            },
            {
              name: "全体順位",
              value: `${globalRank}位`,
              inline: true,
            },
          ],
        },
      ],
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default LevelCommand;
