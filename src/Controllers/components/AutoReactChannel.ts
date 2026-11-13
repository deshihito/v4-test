import {
  ChannelSelectMenuInteraction,
  Client,
  InteractionResponse,
} from "discord.js";
import { ChannelSelectController } from "@/@types/Util";
import AutoReactBase from "@/Controllers/components/AutoReactBase";

class AutoReactChannelController extends AutoReactBase implements ChannelSelectController {
  public readonly client: Client;
  public readonly kind = "channelSelect" as const;
  public readonly customId = "autoreact_channel";
  public readonly prefix = false;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ChannelSelectMenuInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.deny(interaction);

    const channel = interaction.channels.first();
    if (!channel) return;

    await interaction
      .update({ components: [await this.buildPanel(interaction.guildId, channel.id)] })
      .catch(() => {});
  }
}

export default AutoReactChannelController;
