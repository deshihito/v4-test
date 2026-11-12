import { Client, Guild } from "discord.js";
import { GuildDeleteEvent } from "@/@types/Util";
import { prisma } from "@/Models/db";
import sendGlobalChat from "@/Models/sendGlobalChat";

class RemovedEvent implements GuildDeleteEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(guild: Guild): Promise<void> {
    await prisma.joinNotice.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.leaveNotice.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.guildStatistics.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    const count = (
      await prisma.globalChat.deleteMany({
        where: {
          guildId: guild.id,
        },
      })
    ).count;
    if (count > 0) {
      sendGlobalChat({
        title: ":wave: グローバルチャットから1つのサーバーが離脱しました",
        desc: "**　　** ∧＿∧\n　（　´∀｀）＜ なんか知らんけどサーバーなくなったんだってよ",
        userName: "TakasumiBOT Global (System)",
        fromServerId: guild.id,
        footerText: guild.name + ` (${guild.id})`,
      });
    }

    await prisma.hiroyuki.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.publish.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.pin.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.bumpNotice.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.dissokuNotice.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.upNotice.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.bumpNoticeIgnore.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.dissokuNoticeIgnore.deleteMany({
      where: {
        guildId: guild.id,
      },
    });

    await prisma.upNoticeIgnore.deleteMany({
      where: {
        guildId: guild.id,
      },
    });
  }
}

export default RemovedEvent;
