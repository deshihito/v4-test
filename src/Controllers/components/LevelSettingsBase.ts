import {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Colors,
  ContainerBuilder,
  InteractionResponse,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import config from "@/config";
import { findLevelSetting, findLevelGuildSetting } from "@/Models/Level";
import {
  buildLevelSettingsPanel,
  DEFAULT_LEVEL_SETTINGS,
  LevelSettings,
} from "@/Views/levelSettingsPanel";
import { v2 } from "@/util/v2";

export const COLUMNS = {
  notify: '"notify"',
  mention: '"mention"',
  card: '"card"',
} as const;

export type SettingKey = keyof typeof COLUMNS;
export type PanelInteraction = ButtonInteraction | ChannelSelectMenuInteraction;

abstract class LevelSettingsBase {

  protected async buildPanel(
    interaction: PanelInteraction,
    userSettings?: LevelSettings,
  ): Promise<ContainerBuilder> {
    let settings = userSettings;
    if (!settings) {
      const row = await findLevelSetting(interaction.user.id);
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
      const guildSetting = await findLevelGuildSetting(interaction.guildId);
      guild = { notifyChannelId: guildSetting?.notifyChannelId ?? null };
    }

    return buildLevelSettingsPanel(interaction.user.id, settings, guild);
  }

  protected async deny(
    interaction: PanelInteraction,
  ): Promise<InteractionResponse<boolean>> {
    return await interaction.reply(v2({
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
    }));
  }
}

export default LevelSettingsBase;
