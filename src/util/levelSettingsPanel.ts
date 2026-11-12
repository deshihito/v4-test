import {
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";

export interface LevelSettings {
  notify: boolean;
  mention: boolean;
  card: boolean;
}

export const DEFAULT_LEVEL_SETTINGS: LevelSettings = {
  notify: true,
  mention: true,
  card: true,
};

type SettingKey = keyof LevelSettings;

const ITEMS: { key: SettingKey; title: string; description: string }[] = [
  {
    key: "notify",
    title: "レベルアップ通知",
    description: "レベルが上がったときに、そのチャンネルでお知らせします",
  },
  {
    key: "mention",
    title: "通知のメンション",
    description: "レベルアップ通知にメンションを付けます（通知がオンのとき）",
  },
  {
    key: "card",
    title: "レベルカード画像",
    description: "/level の結果にカード画像を付けます",
  },
];

/**
 * /level_settings の Components V2 パネルを組み立てる。
 * 各設定はセクションで、右端のボタンが現在の状態を示し、押すと切り替わる。
 */
export function buildLevelSettingsPanel(
  userId: string,
  settings: LevelSettings,
): ContainerBuilder {
  const container = new ContainerBuilder()
    .setAccentColor(Colors.Green)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## レベル設定"),
      new TextDisplayBuilder().setContent("設定は全サーバー共通です"),
    )
    .addSeparatorComponents(new SeparatorBuilder());

  for (const item of ITEMS) {
    const value = settings[item.key];
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${item.title}**`),
          new TextDisplayBuilder().setContent(item.description),
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(`levelSettings_${item.key}_${userId}`)
            .setLabel(value ? "オン" : "オフ")
            .setStyle(value ? ButtonStyle.Success : ButtonStyle.Secondary),
        ),
    );
  }

  return container;
}
