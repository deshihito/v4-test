import {
  Client,
  User,
  Guild,
  GuildMember,
  GuildBasedChannel,
  Message,
  TextBasedChannel,
  WebhookClient,
  APIMessage,
} from "discord.js";
import DBCache from "@/Models/DBCache";

class Fetch {
  public static async user(client: Client, userId: string): Promise<User | null> {
    try {
      const user = await client.users.fetch(userId);

      DBCache.addUser(user);

      return user;
    } catch {
      return null;
    }
  }

  public static async guild(client: Client, guildId: string): Promise<Guild | null> {
    try {
      return await client.guilds.fetch(guildId);
    } catch {
      return null;
    }
  }

  public static async member(guild: Guild, userId: string): Promise<GuildMember | null> {
    try {
      return await guild.members.fetch(userId);
    } catch {
      return null;
    }
  }

  public static async channel(guild: Guild, channelId: string): Promise<GuildBasedChannel | null> {
    try {
      return await guild.channels.fetch(channelId);
    } catch {
      return null;
    }
  }

  public static async message(
    channel: TextBasedChannel,
    messageId: string,
  ): Promise<Message | null> {
    try {
      return await channel.messages.fetch(messageId);
    } catch {
      return null;
    }
  }

  public static async webhookMessage(
    client: WebhookClient,
    messageId: string,
  ): Promise<APIMessage | null> {
    try {
      return await client.fetchMessage(messageId);
    } catch {
      return null;
    }
  }
}

export default Fetch;
