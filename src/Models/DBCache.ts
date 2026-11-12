import { Guild, User } from "discord.js";
import { prisma } from "@/Models/db";

class DBCache {
  public static async addUser(user: User): Promise<void> {
    await prisma.userCache.upsert({
      where: { id: user.id },
      update: {
        id: user.id,
        username: user.username,
        globalName: user.globalName,
        avatar: user.avatar,
        banner: user.banner,
        accentColor: user.accentColor,
        bot: user.bot,
        flags: user.flags?.bitfield,
      },
      create: {
        id: user.id,
        username: user.username,
        globalName: user.globalName,
        avatar: user.avatar,
        banner: user.banner,
        accentColor: user.accentColor,
        bot: user.bot,
        flags: user.flags?.bitfield,
      },
    });
  }

  public static async addGuild(guild: Guild): Promise<void> {
    const onlineCount = guild.approximatePresenceCount || 0;
    const boostCount = guild.premiumSubscriptionCount || 0;

    await prisma.guildCache.upsert({
      where: { id: guild.id },
      update: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
        onlineCount: onlineCount,
        boostCount: boostCount,
      },
      create: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
        onlineCount: onlineCount,
        boostCount: boostCount,
      },
    });
  }
}

export default DBCache;
