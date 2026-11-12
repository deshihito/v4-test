import { Client, Guild } from "discord.js";
import { GuildDeleteEvent } from "@/@types/Util";
import { deleteGuildData } from "@/Models/GuildCleanup";
import sendGlobalChat from "@/Models/sendGlobalChat";

class RemovedEvent implements GuildDeleteEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(guild: Guild): Promise<void> {
    const count = await deleteGuildData(guild.id);
    if (count > 0) {
      sendGlobalChat({
        title: ":wave: グローバルチャットから1つのサーバーが離脱しました",
        desc: "**　　** ∧＿∧\n　（　´∀｀）＜ なんか知らんけどサーバーなくなったんだってよ",
        userName: "TakasumiBOT Global (System)",
        fromServerId: guild.id,
        footerText: guild.name + ` (${guild.id})`,
      });
    }
  }
}

export default RemovedEvent;
