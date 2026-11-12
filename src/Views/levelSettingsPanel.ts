import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
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

export interface LevelGuildSettings {

  notifyChannelId: string | null;
}

export function buildLevelSettingsPanel(
  userId: string,
  settings: LevelSettings,
  guild?: LevelGuildSettings,
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
            .setLabel(value ? "オフにする" : "オンにする")
            .setStyle(value ? ButtonStyle.Secondary : ButtonStyle.Success),
        ),
    );
  }

  if (guild) {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## サーバー設定"),
        new TextDisplayBuilder().setContent(
          guild.notifyChannelId
            ? `レベルアップ通知は <#${guild.notifyChannelId}> に送ります`
            : "レベルアップ通知は、発言したチャンネルに送ります",
        ),
      )
      .addActionRowComponents(
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId(`levelSettings_channel_${userId}`)
            .setPlaceholder("通知を送るチャンネルを選ぶ")
            .setChannelTypes([ChannelType.GuildText]),
        ),
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`levelSettings_channelReset_${userId}`)
            .setLabel("通知チャンネルを未設定に戻す")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!guild.notifyChannelId),
        ),
      );
  }

  return container;
}
