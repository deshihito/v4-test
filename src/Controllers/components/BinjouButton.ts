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
import { findBinjouSetting, setBinjouEnabled } from "@/Models/Binjou";
import BinjouBase from "@/Controllers/components/BinjouBase";

class BinjouButtonController extends BinjouBase implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "binjou_";
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

    if (
      interaction.customId === "binjou_thinking" ||
      interaction.customId === "binjou_thumbsup"
    ) {
      const key = interaction.customId === "binjou_thinking" ? "thinking" : "thumbsup";
      const settings = await findBinjouSetting(interaction.guildId);
      await setBinjouEnabled(interaction.guildId, key, !settings[key]);
      await interaction
        .update({ components: [await this.buildPanel(interaction.guildId)] })
        .catch(() => {});
      return;
    }

    if (interaction.customId === "binjou_add") {
      const modal = new ModalBuilder()
        .setCustomId("binjou_rulemodal")
        .setTitle("カスタム便乗を追加・編集")
        .addLabelComponents(
          new LabelBuilder()
            .setLabel("反応する絵文字または絵文字ID")
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId("source")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true),
            ),
        )
        .addLabelComponents(
          new LabelBuilder()
            .setLabel("付加する絵文字または絵文字ID")
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId("target")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true),
            ),
        );
      return await interaction.showModal(modal);
    }

    if (interaction.customId === "binjou_delete") {
      const modal = new ModalBuilder()
        .setCustomId("binjou_deletemodal")
        .setTitle("カスタム便乗を削除")
        .addLabelComponents(
          new LabelBuilder()
            .setLabel("削除する反応絵文字または絵文字ID")
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId("source")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true),
            ),
        );
      return await interaction.showModal(modal);
    }
  }
}

export default BinjouButtonController;
