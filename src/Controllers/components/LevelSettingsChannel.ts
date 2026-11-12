import {
  Client,
  ChannelSelectMenuInteraction,
  InteractionResponse,
  PermissionFlagsBits,
} from "discord.js";
import { ChannelSelectController } from "@/@types/Util";
import { upsertLevelGuildSettingNotifyChannel } from "@/Models/Level";
import LevelSettingsBase from "@/Controllers/components/LevelSettingsBase";

class LevelSettingsChannelController
  extends LevelSettingsBase
  implements ChannelSelectController
{
  public readonly client: Client;
  public readonly kind = "channelSelect" as const;
  public readonly customId = "levelSettings_";
  public readonly prefix = true;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ChannelSelectMenuInteraction,
  ): Promise<InteractionResponse<boolean> | void> {

    const [, key, ownerId] = interaction.customId.split("_");
    if (!key) return;

    if (ownerId !== interaction.user.id) return await this.deny(interaction);

    if (key !== "channel") return;
    if (
      !interaction.inGuild() ||
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    )
      return;
    const channelId = interaction.values[0];
    if (!channelId) return;
    await upsertLevelGuildSettingNotifyChannel(interaction.guildId, channelId);
    await interaction
      .update({ components: [await this.buildPanel(interaction)] })
      .catch(() => {});
  }
}

export default LevelSettingsChannelController;
