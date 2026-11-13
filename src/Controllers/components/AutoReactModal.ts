import {
  Client,
  InteractionResponse,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import { setAutoReactEmojis } from "@/Models/AutoReact";
import { normalizeEmojiInput } from "@/Models/Binjou";
import AutoReactBase from "@/Controllers/components/AutoReactBase";

class AutoReactModalController extends AutoReactBase implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "autoreact_modal_";
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

    const channelId = interaction.customId.slice("autoreact_modal_".length);
    if (!channelId) return;

    const text = interaction.fields.getTextInputValue("emojis");
    const raw = text
      .replace(/\n/g, ",")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (raw.length > 20) {
      return await interaction.reply({
        content: "絵文字は1チャンネルにつき20個までです。",
        flags: MessageFlags.Ephemeral,
      });
    }

    let emojis: string[];
    try {
      emojis = [...new Set(raw.map((value) => normalizeEmojiInput(value).display))];
    } catch (error) {
      return await interaction.reply({
        content: error instanceof Error ? error.message : "絵文字の形式が正しくありません。",
        flags: MessageFlags.Ephemeral,
      });
    }

    await setAutoReactEmojis(interaction.guildId, channelId, emojis);
    await interaction.reply({
      content: "Auto react設定を更新しました。",
      flags: MessageFlags.Ephemeral,
    });
    if (interaction.message) {
      await interaction.message
        .edit({ components: [await this.buildPanel(interaction.guildId, channelId)] })
        .catch(() => {});
    }
  }
}

export default AutoReactModalController;
