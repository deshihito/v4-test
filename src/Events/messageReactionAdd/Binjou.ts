import { Client, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { MessageReactionAddEvent } from "@/@types/Util";
import { emojiKey, findBinjouSetting, listBinjouRules } from "@/Models/Binjou";
import InFlight from "@/util/inFlight";

const inFlight = new InFlight();

class BinjouEvent implements MessageReactionAddEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ): Promise<void> {
    if (user.bot) return;
    if (this.client.user && user.id === this.client.user.id) return;

    const partial = reaction.message;
    if (!partial.guildId) return;
    const guildId = partial.guildId;

    await inFlight.runExclusive(partial.id, async () => {
      const message = partial.partial
        ? await partial.fetch().catch(() => null)
        : partial;
      if (!message) return;

      const sourceKey = emojiKey(reaction.emoji.toString());
      const settings = await findBinjouSetting(guildId);

      let target: string | null = null;
      if (sourceKey === emojiKey("🤔")) {
        if (!settings.thinking) return;
        target = "🤔";
      } else if (sourceKey === emojiKey("👍")) {
        if (!settings.thumbsup) return;
        target = "👍";
      } else {
        const rules = await listBinjouRules(guildId);
        const rule = rules.find((candidate) => candidate.sourceKey === sourceKey);
        if (!rule) return;
        target = rule.target;
      }

      const targetKey = emojiKey(target);
      const existing = message.reactions.cache.find(
        (candidate) => emojiKey(candidate.emoji.toString()) === targetKey,
      );
      if (existing?.me) return;

      await message.react(target).catch(() => {});
    });
  }
}

export default BinjouEvent;
