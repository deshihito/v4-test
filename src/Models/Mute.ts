import { muteGuild, muteIp, muteUser } from "@/generated";
import Notice from "@/Models/Notice";
import { prisma } from "@/Models/db";

class Mute {
  public static async getUser(userId: string): Promise<muteUser | null> {
    const user: muteUser | null = await prisma.muteUser.findUnique({
      where: {
        userId: userId,
      },
    });

    return user;
  }

  public static async getGuild(guildId: string): Promise<muteGuild | null> {
    const guild: muteGuild | null = await prisma.muteGuild.findUnique({
      where: {
        guildId: guildId,
      },
    });

    return guild;
  }

  public static async getIp(address: string): Promise<muteIp | null> {
    const ip: muteIp | null = await prisma.muteIp.findUnique({
      where: {
        address: address,
      },
    });

    return ip;
  }

  public static async addUser(userId: string, reason: string): Promise<void> {
    await prisma.muteUser.create({
      data: {
        userId: userId,
        reason: reason,
      },
    });

    await Notice.sendInfo("ミュートユーザーの追加", `${userId}\n${reason}`);
  }

  public static async addGuild(guildId: string, reason: string): Promise<void> {
    await prisma.muteGuild.create({
      data: {
        guildId: guildId,
        reason: reason,
      },
    });

    await Notice.sendInfo("ミュートサーバーの追加", `${guildId}\n${reason}`);
  }

  public static async addIp(address: string, reason: string): Promise<void> {
    const expireAt = new Date();
    expireAt.setMonth(expireAt.getMonth() + 6);

    await prisma.muteIp.create({
      data: {
        address: address,
        reason: reason,
        expireAt: expireAt,
      },
    });

    await Notice.sendInfo("ミュートIPの追加", `${address}\n${reason}`);
  }

  public static async deleteUser(userId: string, reason: string): Promise<void> {
    await prisma.muteUser.delete({
      where: {
        userId: userId,
      },
    });

    await Notice.sendInfo("ミュートユーザーの削除", `${userId}\n${reason}`);
  }

  public static async deleteGuild(guildId: string, reason: string): Promise<void> {
    await prisma.muteGuild.delete({
      where: {
        guildId: guildId,
      },
    });

    await Notice.sendInfo("ミュートサーバーの削除", `${guildId}\n${reason}`);
  }

  public static async deleteIp(address: string, reason: string): Promise<void> {
    await prisma.muteIp.delete({
      where: {
        address: address,
      },
    });

    await Notice.sendInfo("ミュートIPの削除", `${address}\n${reason}`);
  }

  public static async isMuteUser(userId: string): Promise<boolean> {
    return (await this.getUser(userId)) !== null;
  }

  public static async isMuteGuild(guildId: string): Promise<boolean> {
    return (await this.getGuild(guildId)) !== null;
  }

  public static async isMuteIp(address: string): Promise<boolean> {
    return (await this.getIp(address)) !== null;
  }
}

export default Mute;
