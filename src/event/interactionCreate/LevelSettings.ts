import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  MessageFlags,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";
import { prisma } from "@/util/db";
import { buildLevelSettingsPanel, LevelSettings } from "@/util/levelSettingsPanel";

// customId のキー → DB カラム (ホワイトリスト。これ以外の文字列が SQL に入ることはない)
const COLUMNS = {
  notify: '"notify"',
  mention: '"mention"',
  card: '"card"',
} as const;

type SettingKey = keyof typeof COLUMNS;

class LevelSettingsEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isButton() || !interaction.customId.startsWith("levelSettings_")) return;

    // levelSettings_<key>_<userId>
    const [, key, ownerId] = interaction.customId.split("_");
    if (!key || !(key in COLUMNS)) return;

    if (ownerId !== interaction.user.id)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "設定を更新できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "このコマンドは別の人が操作しています",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    // 現在値の反転を1文でアトミックに行う (連打してもトグルが失われない)。
    // 行が無い場合は既定値 true の反転として false で作る。
    const column = COLUMNS[key as SettingKey];
    const rows = await prisma.$queryRawUnsafe<LevelSettings[]>(
      `INSERT INTO "levelSetting" ("userId", ${column}, "updatedAt", "registeredAt")
       VALUES ($1, false, NOW(), NOW())
       ON CONFLICT ("userId")
       DO UPDATE SET ${column} = NOT "levelSetting".${column}, "updatedAt" = NOW()
       RETURNING "notify", "mention", "card"`,
      interaction.user.id,
    );
    const settings = rows[0];

    await interaction
      .update({
        components: [buildLevelSettingsPanel(interaction.user.id, settings)],
      })
      .catch(() => {});
  }
}

export default LevelSettingsEvent;
