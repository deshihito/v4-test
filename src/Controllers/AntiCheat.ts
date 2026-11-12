import { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } from "discord.js";
import config from "@/config";
import { ValidCommandInteraction } from "@/@types/Util";
import { prisma } from "@/Models/db";

class AntiCheat {
  public static async checkAutomation(command: string, userId: string): Promise<boolean> {
    const recentHistory = await prisma.commandHistory.findMany({
      where: {
        userId: userId,
        name: command,
      },
      orderBy: {
        executedAt: "desc",
      },
      take: 6,
    });

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

    await prisma.checkHuman.upsert({
      where: {
        userId: interaction.user.id,
      },
      update: {
        createdAt: new Date(),
      },
      create: {
        userId: interaction.user.id,
      },
    });

    await interaction.showModal(check);
  }

  public static async isCheckingHuman(interaction: ValidCommandInteraction): Promise<boolean> {
    const checkData = await prisma.checkHuman.findUnique({
      where: {
        userId: interaction.user.id,
      },
    });

    if (!checkData) return false;

    this.checkHuman(interaction);

    return true;
  }
}

export default AntiCheat;
