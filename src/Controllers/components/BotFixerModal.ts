import {
  Client,
  InteractionResponse,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import { setBotControlRate, setCommandControlRate } from "@/Models/BotFixer";
import Base, {
  defaultUiState,
  loadCatalog,
  parseRateInputs,
  stateForCommand,
} from "@/Controllers/components/BotFixerBase";
import type { BotFixerUiState } from "@/Views/botFixerPanel";

class BotFixerModalController extends Base implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "botfixer_";
  public readonly prefix = true;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ModalSubmitInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.denyManage(interaction);

    const parts = interaction.customId.split("_");
    const action = parts[1];
    if (action !== "ratemodal" && action !== "botmodal") return;

    const parsed = parseRateInputs(
      interaction.fields.getTextInputValue("count"),
      interaction.fields.getTextInputValue("minutes"),
    );
    if (parsed.kind === "error") {
      return await interaction.reply({
        content: parsed.message,
        flags: MessageFlags.Ephemeral,
      });
    }
    const rule = parsed.kind === "set" ? parsed.rule : null;

    let state: BotFixerUiState;
    let notice: string;
    if (action === "ratemodal") {
      const command = parts.slice(2).join("_");
      await setCommandControlRate(interaction.guildId, command, rule);
      const catalog = await loadCatalog(this.client);
      state = stateForCommand(catalog, command, "rate");
      notice = rule
        ? `/${command} にレート制限（${rule.count}回／${Math.floor(rule.windowSeconds / 60)}分）を設定しました。`
        : `/${command} のレート制限を解除しました。`;
    } else {
      const botId = parts[2];
      await setBotControlRate(interaction.guildId, botId, rule);
      state = { ...defaultUiState(), area: "bot", botTargetId: botId };
      notice = rule
        ? `レート制限（${rule.count}回／${Math.floor(rule.windowSeconds / 60)}分）を設定しました。`
        : "レート制限を解除しました。";
    }

    await interaction.reply({ content: notice, flags: MessageFlags.Ephemeral });
    if (interaction.message) {
      await interaction.message
        .edit({ components: [await this.buildPanel(this.client, interaction.guildId, state)] })
        .catch(() => {});
    }
  }
}

export default BotFixerModalController;
