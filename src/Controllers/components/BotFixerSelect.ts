import {
  Client,
  InteractionResponse,
  StringSelectMenuInteraction,
} from "discord.js";
import { SelectController } from "@/@types/Util";
import { getCommandControl, toggleCommandControlAction } from "@/Models/BotFixer";
import Base, { buildRateModal, defaultUiState } from "@/Controllers/components/BotFixerBase";
import type { BotFixerUiState } from "@/Views/botFixerPanel";

class BotFixerSelectController extends Base implements SelectController {
  public readonly client: Client;
  public readonly kind = "select" as const;
  public readonly customId = "botfixer_";
  public readonly prefix = true;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: StringSelectMenuInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.denyManage(interaction);

    const parts = interaction.customId.split("_");
    const action = parts[1];

    if (action === "root") {
      const state: BotFixerUiState = {
        ...defaultUiState(),
        root: interaction.values[0],
        page: 0,
        purpose: parts[2] === "rate" ? "rate" : "list",
      };
      await interaction
        .update({ components: [await this.buildPanel(this.client, interaction.guildId, state)] })
        .catch(() => {});
      return;
    }

    if (action === "action") {
      const command = interaction.values[0];
      const purpose = parts[4] === "rate" ? "rate" : "list";

      if (purpose === "rate") {
        const data = await getCommandControl(interaction.guildId);
        const rule = data.rates[command];
        const modal = buildRateModal(`botfixer_ratemodal_${command}`, "レート制限", rule);
        return await interaction.showModal(modal);
      }

      const added = await toggleCommandControlAction(interaction.guildId, command);
      const state: BotFixerUiState = {
        ...defaultUiState(),
        root: parts[2],
        page: Number(parts[3]) || 0,
        purpose: "list",
      };
      await interaction
        .update({
          components: [
            await this.buildPanel(
              this.client,
              interaction.guildId,
              state,
              added
                ? `/${command} を対象リストに追加しました。`
                : `/${command} を対象リストから外しました。`,
            ),
          ],
        })
        .catch(() => {});
    }
  }
}

export default BotFixerSelectController;
