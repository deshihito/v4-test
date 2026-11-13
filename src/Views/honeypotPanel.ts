import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import type { HoneypotSettings } from "@/Models/Honeypot";

export function buildHoneypotPanel(settings: HoneypotSettings): ContainerBuilder {
  return new ContainerBuilder()
    .setAccentColor(Colors.White)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## ハニーポットの設定"),
      new TextDisplayBuilder().setContent(
        `状態: **${settings.enabled ? "オン" : "オフ"}**\n` +
          `設置先: ${settings.channelId ? `<#${settings.channelId}>` : "未設定"}\n\n` +
          "選択したチャンネルに警告パネルを設置します。ユーザーが投稿すると、その投稿を削除して対象ユーザーをソフトバン（7日分のメッセージ削除後に解除）します。",
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("honeypot_channel")
          .setPlaceholder("ハニーポットにするテキストチャンネルを選択")
          .setChannelTypes([ChannelType.GuildText, ChannelType.GuildAnnouncement]),
      ),
    );
}

export function buildHoneypotWarning(): ContainerBuilder {
  return new ContainerBuilder()
    .setAccentColor(Colors.White)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "## ⚠️ 警告\nこのチャンネルはハニーポットです。\nここにメッセージを送信すると、投稿は削除され、送信者はソフトバン（7日分のメッセージ削除後に解除）されます。",
      ),
    );
}
