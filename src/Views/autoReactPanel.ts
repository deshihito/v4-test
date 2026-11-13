import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";

export function buildAutoReactPanel(
  rows: { channelId: string; emojis: string[] }[],
  selectedChannelId?: string,
): ContainerBuilder {
  const lines = rows.map((row) => `<#${row.channelId}>: ${row.emojis.join(" ")}`);

  const container = new ContainerBuilder()
    .setAccentColor(Colors.White)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## Auto react設定"),
      new TextDisplayBuilder().setContent(
        "メッセージ受信時に自動で付ける絵文字をチャンネルごとに設定します。\n" +
          "複数の絵文字は改行またはカンマで区切ってください。空欄で選択チャンネルの設定を解除します。\n\n" +
          (lines.length > 0 ? lines.join("\n") : "設定済みチャンネルはありません。"),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("autoreact_channel")
          .setPlaceholder("Auto reactを設定するチャンネルを選択")
          .setChannelTypes([ChannelType.GuildText, ChannelType.GuildAnnouncement]),
      ),
    );

  if (selectedChannelId) {
    container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`autoreact_edit_${selectedChannelId}`)
          .setLabel("選択チャンネルの絵文字を設定")
          .setStyle(ButtonStyle.Primary),
      ),
    );
  }

  return container;
}
