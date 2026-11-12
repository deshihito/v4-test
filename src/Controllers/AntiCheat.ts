import { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } from "discord.js";
import config from "@/config";
import { ValidCommandInteraction } from "@/@types/Util";
import { findRecentCommandHistory } from "@/Models/CommandHistory";
import { upsertCheckHuman, findCheckHuman } from "@/Models/CheckHuman";

class AntiCheat {
  public static async checkAutomation(command: string, userId: string): Promise<boolean> {
    const recentHistory = await findRecentCommandHistory(userId, command);

    if (recentHistory.length < 3) return false;

    const intervals: number[] = [];
    for (let i = 1; i < recentHistory.length; i++) {
      const diff =
        recentHistory[i - 1].executedAt.getTime() - recentHistory[i].executedAt.getTime();

      intervals.push(diff);
    }

    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    const isSuspicious = intervals.every(
      (interval) => Math.abs(interval - avg) <= config.anticheat.automationThreshold,
    );

    return isSuspicious;
  }

  public static async checkHuman(interaction: ValidCommandInteraction): Promise<void> {
    const count1 = Math.floor(Math.random() * 15) + 1;
    const count2 = Math.floor(Math.random() * 15) + 1;

    const code = new LabelBuilder()
      .setLabel(`${count1}+${count2}の答えを入力してください`)
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("code")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("半角で入力してください")
          .setMaxLength(5),
      );

    const check = new ModalBuilder()
      .setCustomId(`checkhuman_${count1 + count2}`)
      .setTitle("あなたは人間ですか？")
      .addLabelComponents(code);

    await upsertCheckHuman(interaction.user.id, new Date());

    await interaction.showModal(check);
  }

  public static async isCheckingHuman(interaction: ValidCommandInteraction): Promise<boolean> {
    const checkData = await findCheckHuman(interaction.user.id);

    if (!checkData) return false;

    this.checkHuman(interaction);

    return true;
  }
}

export default AntiCheat;
