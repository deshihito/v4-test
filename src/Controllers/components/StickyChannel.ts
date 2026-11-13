import {
  ChannelSelectMenuInteraction,
  Client,
  InteractionResponse,
} from "discord.js";
import { ChannelSelectController } from "@/@types/Util";
import { findStickySetting, resendStickyPanel, setStickyChannel } from "@/Models/Sticky";
import StickyBase from "@/Controllers/components/StickyBase";

class StickyChannelController extends StickyBase implements ChannelSelectController {
  public readonly client: Client;
  public readonly kind = "channelSelect" as const;
  public readonly customId = "sticky_channel";
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

    const old = await findStickySetting(interaction.guildId);
    if (old.channelId && old.messageId && old.channelId !== channel.id) {
      const oldChannel = await this.client.channels.fetch(old.channelId).catch(() => null);
      if (oldChannel && oldChannel.isTextBased()) {
        const oldMessage = await oldChannel.messages.fetch(old.messageId).catch(() => null);
        if (oldMessage) await oldMessage.delete().catch(() => {});
      }
    }

    await setStickyChannel(interaction.guildId, channel.id);
    await interaction
      .update({ components: [await this.buildPanel(interaction.guildId, "Stickyパネルの設置先を設定しました。")] })
      .catch(() => {});

    const settings = await findStickySetting(interaction.guildId);
    if (settings.enabled && settings.content) {
      await resendStickyPanel(this.client, interaction.guildId);
    }
  }
}

export default StickyChannelController;
