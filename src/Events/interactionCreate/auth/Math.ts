import {
  Client,
  BaseInteraction,
  TextInputStyle,
  InteractionResponse,
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";

class MathAuthEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isButton() || !interaction.customId.startsWith("math_")) return;

    const data = interaction.customId.split("_");

    const count1 = Math.floor(Math.random() * 15) + 1;
    const count2 = Math.floor(Math.random() * 15) + 1;

    const code = new LabelBuilder()
      .setLabel(`${count1}+${count2}の答えを入力してください`)
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("code")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(5)
          .setPlaceholder("半角で入力してください"),
      );

    const check = new ModalBuilder()
      .setCustomId(`mathrole_${data[1]}_${count1 + count2}`)
      .setTitle("認証")
      .addLabelComponents(code);

    await interaction.showModal(check);
  }
}

export default MathAuthEvent;
