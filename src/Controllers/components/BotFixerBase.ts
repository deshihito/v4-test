import {
  Client,
  Colors,
  ContainerBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  RepliableInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { Command } from "@/@types/Util";
import config from "@/config";
import {
  RATE_MAX_COUNT,
  RATE_MAX_WINDOW_SECONDS,
  SELF_COMMAND,
  getBotControl,
  getCommandControl,
  type RateRule,
} from "@/Models/BotFixer";
import {
  PAGE_SIZE,
  TYPE_ORDER,
  buildBotFixerPanel,
  type BotFixerUiState,
  type CatalogEntry,
} from "@/Views/botFixerPanel";

export const MANAGE_REQUIRED = "サーバーの管理権限が必要です";

let catalogCache: CatalogEntry[] | null = null;

export async function loadCatalog(client: Client): Promise<CatalogEntry[]> {
  if (catalogCache) return catalogCache;
  const dir = "./src/Views/commands/slashcommand";
  const entries: CatalogEntry[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".ts")) continue;
    const moduleURL = pathToFileURL(path.join(dir, file)).href;
    const module = (await import(moduleURL)) as {
      default: new (client: Client) => Command;
    };
    const command = new module.default(client);
    if (command.name === "admin" || command.name === SELF_COMMAND) continue;
    entries.push({ name: command.name, type: command.type, description: command.description });
  }
  entries.sort((a, b) => {
    const typeDiff = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
    return typeDiff !== 0 ? typeDiff : a.name.localeCompare(b.name);
  });
  catalogCache = entries;
  return entries;
}

export function defaultUiState(): BotFixerUiState {
  return { area: "command", root: "info", page: 0, purpose: "list", botTargetId: null };
}

export function stateForCommand(
  catalog: CatalogEntry[],
  command: string,
  purpose: "list" | "rate",
): BotFixerUiState {
  const entry = catalog.find((candidate) => candidate.name === command);
  if (!entry) return { ...defaultUiState(), purpose };
  const specs = catalog.filter((candidate) => candidate.type === entry.type);
  const index = specs.findIndex((candidate) => candidate.name === command);
  return {
    area: "command",
    root: entry.type,
    page: Math.max(0, Math.floor(index / PAGE_SIZE)),
    purpose,
    botTargetId: null,
  };
}

export function buildRateModal(
  customId: string,
  title: string,
  rule: RateRule | null,
): ModalBuilder {
  const countInput = new TextInputBuilder()
    .setCustomId("count")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(5)
    .setRequired(false);
  if (rule) countInput.setValue(String(rule.count));
  const minutesInput = new TextInputBuilder()
    .setCustomId("minutes")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(6)
    .setRequired(false);
  if (rule) minutesInput.setValue(String(Math.max(1, Math.floor(rule.windowSeconds / 60))));
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addLabelComponents(
      new LabelBuilder().setLabel("回数（空欄で解除）").setTextInputComponent(countInput),
    )
    .addLabelComponents(
      new LabelBuilder().setLabel("期間（分）").setTextInputComponent(minutesInput),
    );
}

export function parseRateInputs(
  rawCount: string,
  rawMinutes: string,
): { kind: "clear" } | { kind: "set"; rule: RateRule } | { kind: "error"; message: string } {
  const countText = rawCount.trim();
  const minutesText = rawMinutes.trim();
  if (!countText && !minutesText) return { kind: "clear" };
  const count = Number(countText);
  const minutes = Number(minutesText);
  if (!Number.isInteger(count) || !Number.isInteger(minutes)) {
    return { kind: "error", message: "回数と期間（分）は数字で入力してください。" };
  }
  const windowSeconds = minutes * 60;
  if (count < 1 || count > RATE_MAX_COUNT || windowSeconds < 60 || windowSeconds > RATE_MAX_WINDOW_SECONDS) {
    return {
      kind: "error",
      message: `回数は1〜${RATE_MAX_COUNT}、期間は1〜${RATE_MAX_WINDOW_SECONDS / 60}分で入力してください。`,
    };
  }
  return { kind: "set", rule: { count, windowSeconds } };
}

export abstract class BotFixerBase {
  public canManage(interaction: RepliableInteraction): boolean {
    if (!interaction.inGuild()) return false;
    const permissions = interaction.memberPermissions;
    return Boolean(
      permissions?.has(PermissionFlagsBits.Administrator) ||
        permissions?.has(PermissionFlagsBits.ManageGuild),
    );
  }

  public async denyManage(interaction: RepliableInteraction): Promise<void> {
    await interaction
      .reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "設定を更新できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: MANAGE_REQUIRED,
          },
        ],
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => {});
  }

  public async buildPanel(
    client: Client,
    guildId: string,
    state: BotFixerUiState,
    notice?: string,
  ): Promise<ContainerBuilder> {
    const [data, entries, catalog] = await Promise.all([
      getCommandControl(guildId),
      getBotControl(guildId),
      loadCatalog(client),
    ]);
    const botNames = new Map<string, string>();
    for (const entry of entries) {
      const user = client.users.cache.get(entry.botId);
      if (user) botNames.set(entry.botId, user.username);
    }
    if (state.botTargetId && !botNames.has(state.botTargetId)) {
      const target = client.users.cache.get(state.botTargetId);
      if (target) botNames.set(state.botTargetId, target.username);
    }
    return buildBotFixerPanel(data, entries, catalog, state, botNames, notice);
  }
}

export default BotFixerBase;
