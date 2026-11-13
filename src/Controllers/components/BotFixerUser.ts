import {
  Client,
  InteractionResponse,
  MessageFlags,
  UserSelectMenuInteraction,
} from "discord.js";
import { UserSelectController } from "@/@types/Util";
import Base, { defaultUiState } from "@/Controllers/components/BotFixerBase";
import type { BotFixerUiState } from "@/Views/botFixerPanel";

class BotFixerUserController extends Base implements UserSelectController {
  public readonly client: Client;
  public readonly kind = "userSelect" as const;
  public readonly customId = "botfixer_botuser";
  public readonly prefix = false;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public async execute(
    interaction: UserSelectMenuInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.inGuild()) return;
    if (!this.canManage(interaction)) return await this.denyManage(interaction);

    const user = interaction.users.first();
    if (!user) return;

    if (!user.bot) {
      return await interaction.reply({
        content: "ボットのアカウントを選択してください。",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (this.client.user && user.id === this.client.user.id) {
      return await interaction.reply({
        content: "TakasumiBOT 自身は対象にできません。",
        flags: MessageFlags.Ephemeral,
      });
    }

    const state: BotFixerUiState = { ...defaultUiState(), area: "bot", botTargetId: user.id };
    await interaction
      .update({ components: [await this.buildPanel(this.client, interaction.guildId, state)] })
      .catch(() => {});
  }
}

export default BotFixerUserController;
