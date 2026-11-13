import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  AttachmentBuilder,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { findOmikujiResult, saveOmikujiResult } from "@/Models/Omikuji";
import {
  RANKS,
  drawDailyFortune,
  fortuneFromRecord,
  jstDateString,
  type OmikujiFortune,
  type OmikujiRank,
} from "@/Views/omikujiFortunes";
import { kanjiNumber, renderOmikujiCard } from "@/Views/omikujiCard";
import { v2 } from "@/util/v2";

/** 同じ結果の再投稿を抑える間隔（秒）。結果そのものは日次で固定される。 */
const REPOST_COOLDOWN_SECONDS = 30;

const lastPostedAt = new Map<string, number>();

class OmikujiCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "fun";
  public readonly name: string = "omikuji";
  public readonly description: string = "今日の運勢をおみくじで占います";
  public readonly example: string[] = ["/omikuji"];

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

    const date = jstDateString(new Date());

    const stored = await findOmikujiResult(interaction.user.id, interaction.guild.id, date);

    let fortune: OmikujiFortune;
    if (stored) {
      fortune = fortuneFromRecord({
        format: stored.format,
        number: stored.number,
        rank: stored.rank as OmikujiRank,
        wakaIndex: stored.wakaIndex,
        summaryIndex: stored.summaryIndex,
        itemIndices: stored.itemIndices.split(",").map((v) => Number(v) || 0),
      });
    } else {
      // 保存が無い場合もシード決定的抽選のため、その日は必ず同じ結果になる
      const drawn = drawDailyFortune(interaction.guild.id, interaction.user.id, date);
      const saved = await saveOmikujiResult({
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        date,
        format: drawn.format,
        number: drawn.number,
        rank: drawn.rank,
        wakaIndex: drawn.wakaIndex,
        summaryIndex: drawn.summaryIndex,
        itemIndices: drawn.itemIndices.join(","),
      });
      fortune = fortuneFromRecord({
        format: saved.format,
        number: saved.number,
        rank: saved.rank as OmikujiRank,
        wakaIndex: saved.wakaIndex,
        summaryIndex: saved.summaryIndex,
        itemIndices: saved.itemIndices.split(",").map((v) => Number(v) || 0),
      });
    }

    const cooldownKey = `${interaction.guild.id}:${interaction.user.id}`;
    const now = Date.now();
    const last = lastPostedAt.get(cooldownKey) ?? 0;
    const left = REPOST_COOLDOWN_SECONDS - Math.floor((now - last) / 1000);
    if (last > 0 && left > 0) {
      return await interaction.reply(v2({
        flags: MessageFlags.Ephemeral,
        embeds: [
          {
            color: Colors.Yellow,
            author: {
              name: "今日のおみくじは表示済みです",
              icon_url: config.image.warnIcon,
            },
            description: `結果は1日固定です。あと${left}秒後に再表示できます`,
          },
        ],
      }));
    }

    const card = await renderOmikujiCard(fortune, config.image.botIcon);
    const rankIndex = RANKS.indexOf(fortune.rank);

    await interaction.reply(v2({
      files: card ? [new AttachmentBuilder(card, { name: "omikuji.png" })] : [],
      embeds: [
        {
          color: rankIndex <= 6 ? Colors.Green : Colors.Red,
          author: {
            name: `${interaction.user.displayName}のおみくじ`,
            icon_url: config.image.successIcon,
          },
          ...(card ? { image: { url: "attachment://omikuji.png" } } : {}),
          description: `**第${kanjiNumber(fortune.number)}番 ${fortune.rank}**（${fortune.formatName}）\n${fortune.summary}`,
          ...(card
            ? {}
            : {
                fields: fortune.items.map((item) => ({
                  name: item.name,
                  value: item.text,
                  inline: true,
                })),
              }),
        },
      ],
    }));

    lastPostedAt.set(cooldownKey, now);
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default OmikujiCommand;
