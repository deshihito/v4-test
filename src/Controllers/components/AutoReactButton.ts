import {
  ButtonInteraction,
  Client,
  InteractionResponse,
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import { findAutoReactEmojis } from "@/Models/AutoReact";
import AutoReactBase from "@/Controllers/components/AutoReactBase";

class AutoReactButtonController extends AutoReactBase implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "autoreact_edit_";
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

    const channelId = interaction.customId.slice("autoreact_edit_".length);
    if (!channelId) return;

    const current = await findAutoReactEmojis(interaction.guildId, channelId);
    const input = new TextInputBuilder()
      .setCustomId("emojis")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("🎉, <:custom:123456789012345678>")
      .setMaxLength(500)
      .setRequired(false);
    const prefill = current.join(", ").slice(0, 500);
    if (prefill) input.setValue(prefill);
    const modal = new ModalBuilder()
      .setCustomId(`autoreact_modal_${channelId}`)
      .setTitle("Auto reactの絵文字")
      .addLabelComponents(
        new LabelBuilder()
          .setLabel("自動で付ける絵文字（改行またはカンマ区切り・空欄で解除）")
          .setTextInputComponent(input),
      );
    return await interaction.showModal(modal);
  }
}

export default AutoReactButtonController;
