import {
  Client,
  InteractionResponse,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import {
  deleteBinjouRule,
  normalizeEmojiInput,
  upsertBinjouRule,
} from "@/Models/Binjou";
import BinjouBase from "@/Controllers/components/BinjouBase";

class BinjouModalController extends BinjouBase implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "binjou_";
  public readonly prefix = true;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ModalSubmitInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.deny(interaction);

    try {
      if (interaction.customId === "binjou_rulemodal") {
        const source = normalizeEmojiInput(interaction.fields.getTextInputValue("source"));
        const target = normalizeEmojiInput(interaction.fields.getTextInputValue("target"));
        await upsertBinjouRule(interaction.guildId, source, target);
      } else if (interaction.customId === "binjou_deletemodal") {
        const source = normalizeEmojiInput(interaction.fields.getTextInputValue("source"));
        await deleteBinjouRule(interaction.guildId, source.key);
      } else {
        return;
      }
    } catch (error) {
      return await interaction.reply({
        content: error instanceof Error ? error.message : "設定の更新に失敗しました。",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      content: "カスタム便乗設定を更新しました。",
      flags: MessageFlags.Ephemeral,
    });
    if (interaction.message) {
      await interaction.message
        .edit({ components: [await this.buildPanel(interaction.guildId)] })
        .catch(() => {});
    }
  }
}

export default BinjouModalController;
