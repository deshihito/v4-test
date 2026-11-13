import {
  ButtonInteraction,
  Client,
  InteractionResponse,
  MessageFlags,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import {
  getBotControl,
  removeBotControl,
  setCommandControlMode,
  type CommandControlMode,
} from "@/Models/BotFixer";
import Base, { buildRateModal, defaultUiState } from "@/Controllers/components/BotFixerBase";
import type { BotFixerUiState } from "@/Views/botFixerPanel";

class BotFixerButtonController extends Base implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "botfixer_";
  public readonly prefix = true;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: ButtonInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.denyManage(interaction);

    const parts = interaction.customId.split("_");
    const action = parts[1];

    if (action === "area") {
      const state: BotFixerUiState =
        parts[2] === "bot"
          ? { ...defaultUiState(), area: "bot" }
          : defaultUiState();
      await interaction
        .update({ components: [await this.buildPanel(this.client, interaction.guildId, state)] })
        .catch(() => {});
      return;
    }

    if (action === "mode") {
      const mode = parts[2] as CommandControlMode;
      const state: BotFixerUiState = {
        ...defaultUiState(),
        root: parts[3],
        page: Number(parts[4]) || 0,
        purpose: parts[5] === "rate" ? "rate" : "list",
      };
      await setCommandControlMode(interaction.guildId, mode);
      await interaction
        .update({ components: [await this.buildPanel(this.client, interaction.guildId, state)] })
        .catch(() => {});
      return;
    }

    if (action === "page") {
      const state: BotFixerUiState = {
        ...defaultUiState(),
        root: parts[2],
        page: Math.max(0, Number(parts[3]) || 0),
        purpose: parts[4] === "rate" ? "rate" : "list",
      };
      await interaction
        .update({ components: [await this.buildPanel(this.client, interaction.guildId, state)] })
        .catch(() => {});
      return;
    }

    if (action === "purpose") {
      const state: BotFixerUiState = {
        ...defaultUiState(),
        root: parts[2],
        page: Number(parts[3]) || 0,
        purpose: parts[4] === "rate" ? "rate" : "list",
      };
      await interaction
        .update({ components: [await this.buildPanel(this.client, interaction.guildId, state)] })
        .catch(() => {});
      return;
    }

    if (action === "botrate") {
      const botId = parts[2];
      const entries = await getBotControl(interaction.guildId);
      const entry = entries.find((candidate) => candidate.botId === botId);
      if (!entry) {
        return await interaction.reply({
          content: "先に許可チャンネルを設定してください。",
          flags: MessageFlags.Ephemeral,
        });
      }
      const modal = buildRateModal(`botfixer_botmodal_${botId}`, "ボットのレート制限", entry.rate);
      return await interaction.showModal(modal);
    }

    if (action === "botremove") {
      const botId = parts[2];
      await removeBotControl(interaction.guildId, botId);
      const state: BotFixerUiState = { ...defaultUiState(), area: "bot" };
      await interaction
        .update({
          components: [
            await this.buildPanel(
              this.client,
              interaction.guildId,
              state,
              "ボット制限の対象から外しました。",
            ),
          ],
        })
        .catch(() => {});
    }
  }
}

export default BotFixerButtonController;
