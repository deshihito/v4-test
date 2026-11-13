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
import type { StickySettings } from "@/Models/Sticky";

export function buildStickyPanel(settings: StickySettings, notice?: string): ContainerBuilder {
  const content = settings.content
    ? settings.content.length > 200
      ? `${settings.content.slice(0, 199)}…`
      : settings.content
    : "未設定";

  const container = new ContainerBuilder().setAccentColor(Colors.Blue);

  if (notice) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(notice));
  }

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## Stickyパネルの設定"),
      new TextDisplayBuilder().setContent(
        `状態: **${settings.enabled ? "オン" : "オフ"}**\n` +
          `設置先: ${settings.channelId ? `<#${settings.channelId}>` : "未設定"}\n` +
          `文言: ${content}\n\n` +
          "設置先のチャンネルに誰かが投稿すると、直前のStickyパネルを削除して再送信します。",
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("sticky_channel")
          .setPlaceholder("Stickyパネルを置くテキストチャンネルを選択")
          .setChannelTypes([ChannelType.GuildText, ChannelType.GuildAnnouncement]),
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("sticky_text")
          .setLabel("文言を設定・更新")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("sticky_toggle")
          .setLabel(settings.enabled ? "オフにする" : "オンにする")
          .setStyle(settings.enabled ? ButtonStyle.Secondary : ButtonStyle.Success),
      ),
    );

  return container;
}
