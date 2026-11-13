import {
  ButtonInteraction,
  Colors,
  ContainerBuilder,
  InteractionResponse,
  MessageFlags,
  ModalSubmitInteraction,
  PermissionFlagsBits,
} from "discord.js";
import config from "@/config";
import { findBinjouSetting, listBinjouRules } from "@/Models/Binjou";
import { buildBinjouPanel } from "@/Views/binjouPanel";
import { v2 } from "@/util/v2";

export type BinjouPanelInteraction = ButtonInteraction | ModalSubmitInteraction;

abstract class BinjouBase {
  protected canManage(interaction: BinjouPanelInteraction): boolean {
    if (!interaction.inGuild()) return false;
    return Boolean(
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
        interaction.memberPermissions?.has(PermissionFlagsBits.Administrator),
    );
  }

  protected async deny(
    interaction: BinjouPanelInteraction,
  ): Promise<InteractionResponse<boolean>> {
    return await interaction.reply(v2({
      embeds: [
        {
          color: Colors.Red,
          author: { name: "設定を更新できませんでした", icon_url: config.image.errorIcon },
          description: "サーバーの管理権限が必要です",
        },
      ],
      flags: MessageFlags.Ephemeral,
    }));
  }

  protected async buildPanel(guildId: string): Promise<ContainerBuilder> {
    const [settings, rules] = await Promise.all([
      findBinjouSetting(guildId),
      listBinjouRules(guildId),
    ]);
    return buildBinjouPanel(settings, rules);
  }
}

export default BinjouBase;
