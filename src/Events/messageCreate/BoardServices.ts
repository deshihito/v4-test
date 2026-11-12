import { Client, Message } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import { handleBoardServiceMessage } from "@/Models/boardServices";

class BoardServicesEvent implements MessageCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    await handleBoardServiceMessage(message);
  }
}

export default BoardServicesEvent;
