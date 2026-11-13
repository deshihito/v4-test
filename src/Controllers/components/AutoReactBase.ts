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
import { listAutoReactChannels } from "@/Models/AutoReact";
import { buildAutoReactPanel } from "@/Views/autoReactPanel";

export type AutoReactPanelInteraction =
  | ButtonInteraction
  | ChannelSelectMenuInteraction
  | ModalSubmitInteraction;

abstract class AutoReactBase {
  protected canManage(interaction: AutoReactPanelInteraction): boolean {
    if (!interaction.inGuild()) return false;
    return Boolean(
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
        interaction.memberPermissions?.has(PermissionFlagsBits.Administrator),
    );
  }

  protected async deny(
    interaction: AutoReactPanelInteraction,
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
    selectedChannelId?: string,
  ): Promise<ContainerBuilder> {
    const rows = await listAutoReactChannels(guildId);
    return buildAutoReactPanel(rows, selectedChannelId);
  }
}

export default AutoReactBase;
