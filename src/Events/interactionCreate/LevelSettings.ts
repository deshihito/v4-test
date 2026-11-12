import {
  Client,
  BaseInteraction,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Colors,
  ContainerBuilder,
  InteractionResponse,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";
import { prisma } from "@/Models/db";
import {
  buildLevelSettingsPanel,
  DEFAULT_LEVEL_SETTINGS,
  LevelSettings,
} from "@/Views/commands/levelSettingsPanel";

// customId のキー → DB カラム (ホワイトリスト。これ以外の文字列が SQL に入ることはない)
const COLUMNS = {
  notify: '"notify"',
  mention: '"mention"',
  card: '"card"',
} as const;

type SettingKey = keyof typeof COLUMNS;
type PanelInteraction = ButtonInteraction | ChannelSelectMenuInteraction;

class LevelSettingsEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  // 現在の DB の状態からパネルを組み立てる (管理者にはギルド設定も付く)
  private async buildPanel(
    interaction: PanelInteraction,
    userSettings?: LevelSettings,
  ): Promise<ContainerBuilder> {
    let settings = userSettings;
    if (!settings) {
      const row = await prisma.levelSetting.findUnique({
        where: { userId: interaction.user.id },
      });
      settings = {
        notify: row?.notify ?? DEFAULT_LEVEL_SETTINGS.notify,
        mention: row?.mention ?? DEFAULT_LEVEL_SETTINGS.mention,
        card: row?.card ?? DEFAULT_LEVEL_SETTINGS.card,
      };
    }

    let guild: { notifyChannelId: string | null } | undefined;
    if (
      interaction.inGuild() &&
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      const guildSetting = await prisma.levelGuildSetting.findUnique({
        where: { guildId: interaction.guildId },
      });
      guild = { notifyChannelId: guildSetting?.notifyChannelId ?? null };
    }

    return buildLevelSettingsPanel(interaction.user.id, settings, guild);
  }

  private async deny(interaction: PanelInteraction): Promise<InteractionResponse<boolean>> {
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
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (
      !(interaction.isButton() || interaction.isChannelSelectMenu()) ||
      !interaction.customId.startsWith("levelSettings_")
    )
      return;

    // levelSettings_<key>_<userId>
    const [, key, ownerId] = interaction.customId.split("_");
    if (!key) return;

    if (ownerId !== interaction.user.id) return await this.deny(interaction);

    // ギルドの通知チャンネル変更 (チャンネル選択メニュー)
    if (key === "channel" && interaction.isChannelSelectMenu()) {
      if (
        !interaction.inGuild() ||
        !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
      )
        return;
      const channelId = interaction.values[0];
      if (!channelId) return;
      await prisma.levelGuildSetting.upsert({
        where: { guildId: interaction.guildId },
        create: { guildId: interaction.guildId, notifyChannelId: channelId },
        update: { notifyChannelId: channelId },
      });
      await interaction
        .update({ components: [await this.buildPanel(interaction)] })
        .catch(() => {});
      return;
    }

    // ギルドの通知チャンネルを未設定に戻す
    if (key === "channelReset" && interaction.isButton()) {
      if (
        !interaction.inGuild() ||
        !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
      )
        return;
      await prisma.levelGuildSetting.upsert({
        where: { guildId: interaction.guildId },
        create: { guildId: interaction.guildId, notifyChannelId: null },
        update: { notifyChannelId: null },
      });
      await interaction
        .update({ components: [await this.buildPanel(interaction)] })
        .catch(() => {});
      return;
    }

    if (!(key in COLUMNS) || !interaction.isButton()) return;

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

    await interaction
      .update({ components: [await this.buildPanel(interaction, rows[0])] })
      .catch(() => {});
  }
}

export default LevelSettingsEvent;
