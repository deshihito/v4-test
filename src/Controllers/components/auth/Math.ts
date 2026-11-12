import {
  Client,
  TextInputStyle,
  InteractionResponse,
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  ButtonInteraction,
} from "discord.js";
import { ButtonController } from "@/@types/Util";

class MathAuthEvent implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "math_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ButtonInteraction): Promise<InteractionResponse<boolean> | void> {

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
