import { Client, Message, PermissionFlagsBits } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import { findHoneypotSetting } from "@/Models/Honeypot";

class HoneypotEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (!message.inGuild() || message.author.bot) return;

    const permissions = message.member?.permissions;
    if (
      permissions?.has(PermissionFlagsBits.Administrator) ||
      permissions?.has(PermissionFlagsBits.ManageGuild) ||
      permissions?.has(PermissionFlagsBits.BanMembers)
    )
      return;

    const settings = await findHoneypotSetting(message.guild.id);
    if (!settings.enabled || settings.channelId !== message.channelId) return;

    await message.delete().catch(() => {});

    try {
      await message.guild.members.ban(message.author.id, {
        deleteMessageSeconds: 7 * 24 * 60 * 60,
        reason: "ハニーポットチャンネルへの投稿",
      });
      await message.guild.members.unban(
        message.author.id,
        "ハニーポットによる一時BAN解除",
      );
    } catch {}
  }
}

export default HoneypotEvent;
