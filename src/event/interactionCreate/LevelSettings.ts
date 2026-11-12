import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";
import { prisma } from "@/util/db";

class LevelSettingsEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isButton() || !interaction.customId.startsWith("levelSettings_")) return;

    const data = interaction.customId.split("_");

    if (data[1] !== interaction.user.id)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "設定を更新できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "このコマンドは別の人が操作しています",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    // 現在値の反転を1文でアトミックに行う (連打してもトグルが失われない)。
    // 行が無い場合は既定値 true の反転として false で作る。
    const rows = await prisma.$queryRaw<{ notify: boolean }[]>`
      INSERT INTO "levelSetting" ("userId", "notify", "updatedAt", "registeredAt")
      VALUES (${interaction.user.id}, false, NOW(), NOW())
      ON CONFLICT ("userId")
      DO UPDATE SET "notify" = NOT "levelSetting"."notify", "updatedAt" = NOW()
      RETURNING "notify"`;
    const notify: boolean = rows[0].notify;

    await interaction
      .update({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "レベル設定",
              icon_url: config.image.configIcon,
            },
            description: `レベルアップ通知: **${notify ? "オン" : "オフ"}**`,
          },
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`levelSettings_${interaction.user.id}`)
              .setLabel(notify ? "レベルアップ通知をオフにする" : "レベルアップ通知をオンにする")
              .setStyle(notify ? ButtonStyle.Danger : ButtonStyle.Success),
          ),
        ],
      })
      .catch(() => {});
  }
}

export default LevelSettingsEvent;
