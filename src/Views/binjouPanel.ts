import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import type { BinjouRule, BinjouSettings } from "@/Models/Binjou";

export function buildBinjouPanel(settings: BinjouSettings, rules: BinjouRule[]): ContainerBuilder {
  const lines = rules.map((rule) => `${rule.source} → ${rule.target}`);

  const container = new ContainerBuilder()
    .setAccentColor(Colors.White)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## 絵文字便乗設定（binjou）"),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**🤔 → 🤔**"),
          new TextDisplayBuilder().setContent("🤔 のリアクションに便乗します"),
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId("binjou_thinking")
            .setLabel(settings.thinking ? "オフにする" : "オンにする")
            .setStyle(settings.thinking ? ButtonStyle.Secondary : ButtonStyle.Success),
        ),
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**👍 → 👍**"),
          new TextDisplayBuilder().setContent("👍 のリアクションに便乗します"),
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId("binjou_thumbsup")
            .setLabel(settings.thumbsup ? "オフにする" : "オンにする")
            .setStyle(settings.thumbsup ? ButtonStyle.Secondary : ButtonStyle.Success),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `カスタム便乗（${rules.length}/20）\n` +
          (lines.length > 0 ? lines.join("\n") : "登録なし") +
          "\n\n同じ絵文字ならその絵文字を付加し、異なる場合は追加リアクションとして動作します。",
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("binjou_add")
          .setLabel("カスタム追加・編集")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("binjou_delete")
          .setLabel("カスタム削除")
          .setStyle(ButtonStyle.Danger),
      ),
    );

  return container;
}
