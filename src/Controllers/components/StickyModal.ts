import {
  Client,
  InteractionResponse,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import { resendStickyPanel, setStickyContent } from "@/Models/Sticky";
import StickyBase from "@/Controllers/components/StickyBase";

class StickyModalController extends StickyBase implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "sticky_modal";
  public readonly prefix = false;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ModalSubmitInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.deny(interaction);

    const content = interaction.fields.getTextInputValue("content");
    await setStickyContent(interaction.guildId, content);
    await interaction.reply({
      content: "文言を保存しました。",
      flags: MessageFlags.Ephemeral,
    });
    if (interaction.message) {
      await interaction.message
        .edit({ components: [await this.buildPanel(interaction.guildId)] })
        .catch(() => {});
    }
    await resendStickyPanel(this.client, interaction.guildId);
  }
}

export default StickyModalController;
