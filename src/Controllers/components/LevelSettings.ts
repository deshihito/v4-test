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

    const [, key, ownerId] = interaction.customId.split("_");
    if (!key) return;

    if (ownerId !== interaction.user.id) return await this.deny(interaction);

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

    const column = COLUMNS[key as SettingKey];
    const rows = await toggleLevelSetting(interaction.user.id, column);

    await interaction
      .update({ components: [await this.buildPanel(interaction, rows[0])] })
      .catch(() => {});
  }
}

export default LevelSettingsButtonController;
