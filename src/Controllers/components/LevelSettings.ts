import {
  Client,
  ButtonInteraction,
  InteractionResponse,
  PermissionFlagsBits,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import {
  upsertLevelGuildSettingNotifyChannel,
  toggleLevelSetting,
} from "@/Models/Level";
import LevelSettingsBase, { COLUMNS, SettingKey } from "@/Controllers/components/LevelSettingsBase";

class LevelSettingsButtonController extends LevelSettingsBase implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "levelSettings_";
  public readonly prefix = true;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ButtonInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    // levelSettings_<key>_<userId>
    const [, key, ownerId] = interaction.customId.split("_");
    if (!key) return;

    if (ownerId !== interaction.user.id) return await this.deny(interaction);

    // ギルドの通知チャンネルを未設定に戻す
    if (key === "channelReset") {
      if (
        !interaction.inGuild() ||
        !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
      )
        return;
      await upsertLevelGuildSettingNotifyChannel(interaction.guildId, null);
      await interaction
        .update({ components: [await this.buildPanel(interaction)] })
        .catch(() => {});
      return;
    }

    if (!(key in COLUMNS)) return;

    // 現在値の反転を1文でアトミックに行う (連打してもトグルが失われない)。
    // 行が無い場合は既定値 true の反転として false で作る。
    const column = COLUMNS[key as SettingKey];
    const rows = await toggleLevelSetting(interaction.user.id, column);

    await interaction
      .update({ components: [await this.buildPanel(interaction, rows[0])] })
      .catch(() => {});
  }
}

export default LevelSettingsButtonController;
