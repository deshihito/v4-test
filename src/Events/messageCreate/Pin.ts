import { Client, Message, ChannelType, MessageFlags, WebhookClient } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import RateLimit from "@/Controllers/RateLimit";
import sleep from "@/util/sleep";
import { deletePin, findPin, updatePinMessageId } from "@/Models/Pin";
import { v2 } from "@/util/v2";

class PinEvent implements MessageCreateEvent {
  public readonly client: Client;
  private readonly rateLimit: RateLimit = new RateLimit(3000, true);

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || message.channel.type === ChannelType.GroupDM) return;

    const pinData = await findPin(message.channel.id);

    if (!pinData) return;

    try {
      if (this.rateLimit.count(message.channel.id)) return;

      await sleep(2000);

      const webhook = new WebhookClient({ url: pinData.webhookUrl });

      const beforeMsg = await webhook.fetchMessage(pinData.messegeId);
      await webhook.deleteMessage(beforeMsg.id);

      const afterMsg = await webhook.send(
        beforeMsg.embeds.length > 0
          ? v2({ embeds: beforeMsg.embeds })
          : {
              components: beforeMsg.components,
              flags: MessageFlags.IsComponentsV2,
            },
      );

      await updatePinMessageId(pinData.channelId, afterMsg.id);
    } catch {
      await deletePin(message.channel.id);
    }
  }
}

export default PinEvent;
