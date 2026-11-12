import { Client, Message, OmitPartialGroupDMChannel, PartialMessage } from "discord.js";
import { MessageUpdateEvent } from "@/@types/Util";
import { handleBoardServiceMessage } from "@/Models/boardServices";

class BoardServicesUpdateEvent implements MessageUpdateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>,
    newMessage: OmitPartialGroupDMChannel<Message<boolean>>,
  ): Promise<void> {
    if (!newMessage.author) return;
    await handleBoardServiceMessage(newMessage as Message);
  }
}

export default BoardServicesUpdateEvent;
