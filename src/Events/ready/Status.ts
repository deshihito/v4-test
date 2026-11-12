import { Client, ActivityType } from "discord.js";
import { ReadyEvent } from "@/@types/Util";
import getGuildCount from "@/Models/getGuildCount";
import getUserCount from "@/Models/getUserCount";

class StatusEvent implements ReadyEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(): Promise<void> {
    if (!this.client.isReady()) return;

    this.client.user.setStatus("online");

    let stats = 0;
    setInterval(async () => {
      if (!this.client.isReady()) return;

      if (stats === 0) {
        this.client.user.setActivity(`/help || ping:${this.client.ws.ping}ms`, {
          type: ActivityType.Playing,
        });

        stats = 1;
      } else if (stats === 1) {
        const guildCount = await getGuildCount(this.client);
        const userCount = await getUserCount(this.client);
        let text = "";

        if (guildCount === -1 || userCount === -1) {
          text = "起動中";
        } else {
          text = `${guildCount} server || ${userCount} user${this.client.shard ? ` || ${this.client.shard.count}shard` : ""}`;
        }

        this.client.user.setActivity(text, {
          type: ActivityType.Playing,
        });

        stats = 0;
      }
    }, 5000);
  }
}

export default StatusEvent;
