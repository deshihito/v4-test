import {
  ButtonInteraction,
  Client,
  InteractionResponse,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import { findStickySetting, resendStickyPanel, setStickyEnabled } from "@/Models/Sticky";
import StickyBase from "@/Controllers/components/StickyBase";

class StickyButtonController extends StickyBase implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "sticky_";
  public readonly prefix = true;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ButtonInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.deny(interaction);

    if (interaction.customId === "sticky_text") {
      const settings = await findStickySetting(interaction.guildId);
      if (!settings.channelId) {
        return await interaction.reply({
          content: "先にStickyパネルを置くチャンネルを選択してください。",
          flags: MessageFlags.Ephemeral,
        });
      }
      const input = new TextInputBuilder()
        .setCustomId("content")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("例: お問い合わせはこのチャンネルに送信してください。")
        .setMaxLength(2000)
        .setRequired(true);
      if (settings.content) input.setValue(settings.content.slice(0, 2000));
      const modal = new ModalBuilder()
        .setCustomId("sticky_modal")
        .setTitle("Stickyパネルの文言")
        .addLabelComponents(
          new LabelBuilder().setLabel("パネルに表示する文言").setTextInputComponent(input),
        );
      return await interaction.showModal(modal);
    }

    if (interaction.customId === "sticky_toggle") {
      const settings = await findStickySetting(interaction.guildId);
      const enabled = !settings.enabled;
      if (enabled && (!settings.channelId || !settings.content)) {
        return await interaction.reply({
          content: "先に設置先と文言を設定してください。",
          flags: MessageFlags.Ephemeral,
        });
      }
      await setStickyEnabled(interaction.guildId, enabled);
      await interaction
        .update({
          components: [
            await this.buildPanel(
              interaction.guildId,
              enabled ? "Stickyパネルをオンにしました。" : "Stickyパネルをオフにしました。",
            ),
          ],
        })
        .catch(() => {});
      if (enabled) await resendStickyPanel(this.client, interaction.guildId);
    }
  }
}

export default StickyButtonController;
