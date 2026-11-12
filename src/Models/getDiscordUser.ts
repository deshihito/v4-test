import { APIUser } from "discord.js";
import { prisma } from "@/Models/db";
import { env } from "@/util/Env";

export async function fetchAndCacheUser(userId: string) {
  const dbUser = await prisma.userCache.findUnique({
    where: { id: userId },
  });

  if (!dbUser) {
    const discordRes = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bot ${env.BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!discordRes.ok) return null;

    const user: APIUser = await discordRes.json();

    await prisma.userCache.upsert({
      where: { id: user.id },
      update: {
        id: user.id,
        username: user.username,
        globalName: user.global_name,
        avatar: user.avatar,
        banner: user.banner,
        accentColor: user.accent_color,
        bot: user.bot || false,
        flags: user.public_flags,
      },
      create: {
        id: user.id,
        username: user.username,
        globalName: user.global_name,
        avatar: user.avatar,
        banner: user.banner,
        accentColor: user.accent_color,
        bot: user.bot || false,
        flags: user.public_flags,
      },
    });

    return {
      id: user.id,
      username: user.username,
      global_name: user.global_name,
      avatarURL: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : null,
      avatar: user.avatar,
      bannerURL: user.banner
        ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png`
        : null,
      banner: user.banner,
      accentColor: user.accent_color,
      bot: user.bot || false,
      flags: user.public_flags,
    };
  }

  return {
    id: dbUser.id,
    username: dbUser.username,
    global_name: dbUser.globalName,
    avatarURL: dbUser.avatar
      ? `https://cdn.discordapp.com/avatars/${dbUser.id}/${dbUser.avatar}.png`
      : null,
    avatar: dbUser.avatar,
    bannerURL: dbUser.banner
      ? `https://cdn.discordapp.com/banners/${dbUser.id}/${dbUser.banner}.png`
      : null,
    banner: dbUser.banner,
    accentColor: dbUser.accentColor,
    bot: dbUser.bot,
    flags: dbUser.flags,
  };
}
