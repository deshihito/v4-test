import { Client } from "discord.js";
import { ReadyEvent } from "@/@types/Util";
import updateStatus from "@/util/updateStatus";

class UpdateEvent implements ReadyEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(): Promise<void> {
    if (!this.client.shard || !this.client.isReady()) return;

    setInterval(async () => {
      updateStatus(this.client);
    }, 20 * 1000);
  }
}

export default UpdateEvent;
