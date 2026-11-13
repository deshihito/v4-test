import {
  ChannelSelectMenuInteraction,
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { ChannelSelectController } from "@/@types/Util";
import config from "@/config";
import { findHoneypotSetting, sendHoneypotWarning, setHoneypotChannel } from "@/Models/Honeypot";
import { buildHoneypotPanel } from "@/Views/honeypotPanel";

class HoneypotChannelController implements ChannelSelectController {
  public readonly client: Client;
  public readonly kind = "channelSelect" as const;
  public readonly customId = "honeypot_channel";
  public readonly prefix = false;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: ChannelSelectMenuInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: { name: "設定を更新できませんでした", icon_url: config.image.errorIcon },
            description: "サーバーの管理権限が必要です",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = interaction.channels.first();
    if (!channel) return;

    const old = await findHoneypotSetting(interaction.guildId);
    if (old.channelId && old.messageId && old.channelId !== channel.id) {
      const oldChannel = await this.client.channels.fetch(old.channelId).catch(() => null);
      if (oldChannel && oldChannel.isTextBased()) {
        const oldMessage = await oldChannel.messages.fetch(old.messageId).catch(() => null);
        if (oldMessage) await oldMessage.delete().catch(() => {});
      }
    }

    await setHoneypotChannel(interaction.guildId, channel.id);
    await sendHoneypotWarning(this.client, interaction.guildId);

    const settings = await findHoneypotSetting(interaction.guildId);
    await interaction
      .update({ components: [buildHoneypotPanel(settings)] })
      .catch(() => {});
  }
}

export default HoneypotChannelController;
