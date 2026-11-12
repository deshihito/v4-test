import { Client, Message, ChannelType, WebhookClient } from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import RateLimit from "@/Controllers/RateLimit";
import sleep from "@/util/sleep";
import { prisma } from "@/Models/db";

class PinEvent implements MessageCreateEvent {
  public readonly client: Client;
  private readonly rateLimit: RateLimit = new RateLimit(3000, true);

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || message.channel.type === ChannelType.GroupDM) return;

    const pinData = await prisma.pin.findUnique({
      where: {
        channelId: message.channel.id,
      },
    });

    if (!pinData) return;

    try {
      if (this.rateLimit.count(message.channel.id)) return;

      await sleep(2000);

      const webhook = new WebhookClient({ url: pinData.webhookUrl });

      const beforeMsg = await webhook.fetchMessage(pinData.messegeId);
      await webhook.deleteMessage(beforeMsg.id);

      const afterMsg = await webhook.send({
        embeds: beforeMsg.embeds,
      });

      await prisma.pin.update({
        where: { channelId: pinData.channelId },
        data: {
          messegeId: afterMsg.id,
        },
      });
    } catch {
      await prisma.pin.delete({
        where: {
          channelId: message.channel.id,
        },
      });
    }
  }
}

export default PinEvent;
