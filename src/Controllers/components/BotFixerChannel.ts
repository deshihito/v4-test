import {
  ChannelSelectMenuInteraction,
  Client,
  InteractionResponse,
} from "discord.js";
import { ChannelSelectController } from "@/@types/Util";
import { setBotControlChannels } from "@/Models/BotFixer";
import Base, { defaultUiState } from "@/Controllers/components/BotFixerBase";
import type { BotFixerUiState } from "@/Views/botFixerPanel";

class BotFixerChannelController extends Base implements ChannelSelectController {
  public readonly client: Client;
  public readonly kind = "channelSelect" as const;
  public readonly customId = "botfixer_botchannels_";
  public readonly prefix = true;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ChannelSelectMenuInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.denyManage(interaction);

    const botId = interaction.customId.slice("botfixer_botchannels_".length);
    if (!botId) return;

    const channelIds = interaction.values;
    if (channelIds.length === 0) return;

    await setBotControlChannels(interaction.guildId, botId, channelIds);
    const state: BotFixerUiState = { ...defaultUiState(), area: "bot", botTargetId: botId };
    await interaction
      .update({
        components: [
          await this.buildPanel(
            this.client,
            interaction.guildId,
            state,
            "許可チャンネルを設定しました。",
          ),
        ],
      })
      .catch(() => {});
  }
}

export default BotFixerChannelController;
