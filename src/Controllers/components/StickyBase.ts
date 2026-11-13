import {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Colors,
  ContainerBuilder,
  InteractionResponse,
  MessageFlags,
  ModalSubmitInteraction,
  PermissionFlagsBits,
} from "discord.js";
import config from "@/config";
import { findStickySetting } from "@/Models/Sticky";
import { buildStickyPanel } from "@/Views/stickyPanel";

export type StickyPanelInteraction =
  | ButtonInteraction
  | ChannelSelectMenuInteraction
  | ModalSubmitInteraction;

abstract class StickyBase {
  protected canManage(interaction: StickyPanelInteraction): boolean {
    if (!interaction.inGuild()) return false;
    return Boolean(
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
        interaction.memberPermissions?.has(PermissionFlagsBits.Administrator),
    );
  }

  protected async deny(
    interaction: StickyPanelInteraction,
  ): Promise<InteractionResponse<boolean>> {
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

  protected async buildPanel(
    guildId: string,
    notice?: string,
  ): Promise<ContainerBuilder> {
    const settings = await findStickySetting(guildId);
    return buildStickyPanel(settings, notice);
  }
}

export default StickyBase;
