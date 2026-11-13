import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  ContainerBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  UserSelectMenuBuilder,
} from "discord.js";
import {
  COMMAND_CONTROL_MODE_LABELS,
  type BotControlEntry,
  type CommandControlData,
  type CommandControlMode,
} from "@/Models/BotFixer";

export interface BotFixerUiState {
  area: "command" | "bot";
  root: string;
  page: number;
  purpose: "list" | "rate";
  botTargetId: string | null;
}

export interface CatalogEntry {
  name: string;
  type: string;
  description: string;
}

export const TYPE_ORDER = [
  "info",
  "server",
  "manage",
  "tool",
  "search",
  "fun",
  "account",
  "stock",
  "gift",
  "money",
  "bot",
  "setting",
  "othor",
];

export const TYPE_LABELS: Record<string, string> = {
  info: "情報",
  server: "サーバー関連",
  manage: "管理",
  tool: "ツール",
  search: "検索",
  fun: "ネタ",
  account: "アカウント",
  stock: "株",
  gift: "ギフト",
  money: "お金",
  bot: "Bot関連",
  setting: "設定",
  othor: "その他",
};

export const PAGE_SIZE = 25;

function areaRow(state: BotFixerUiState): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("botfixer_area_command")
      .setLabel(`コマンド制限${state.area === "command" ? "（現在）" : ""}`)
      .setStyle(state.area === "command" ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(state.area === "command"),
    new ButtonBuilder()
      .setCustomId("botfixer_area_bot")
      .setLabel(`他ボット制限${state.area === "bot" ? "（現在）" : ""}`)
      .setStyle(state.area === "bot" ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(state.area === "bot"),
  );
}

function commandStatus(data: CommandControlData): string {
  const lines = [`モード: **${COMMAND_CONTROL_MODE_LABELS[data.mode]}**`];
  if (data.actions.length > 0) {
    const shown = data.actions.slice(0, 10).map((name) => `/${name}`);
    const suffix = data.actions.length > 10 ? ` 他${data.actions.length - 10}件` : "";
    lines.push(`対象リスト（${data.actions.length}件）: ${shown.join("、")}${suffix}`);
  } else {
    lines.push("対象リスト: （空）");
  }
  const rates = Object.entries(data.rates);
  if (rates.length > 0) {
    const parts = rates
      .slice(0, 10)
      .map(([name, rule]) => `/${name} ${rule.count}回/${Math.floor(rule.windowSeconds / 60)}分`);
    const suffix = rates.length > 10 ? ` 他${rates.length - 10}件` : "";
    lines.push(`レート制限（${rates.length}件）: ${parts.join("、")}${suffix}`);
  } else {
    lines.push("レート制限: なし");
  }
  lines.push("サーバー管理者は制限の対象外です。");
  return lines.join("\n");
}

function buildCommandArea(
  container: ContainerBuilder,
  data: CommandControlData,
  catalog: CatalogEntry[],
  state: BotFixerUiState,
): void {
  const roots = TYPE_ORDER.filter((type) => catalog.some((entry) => entry.type === type));
  const root = roots.includes(state.root) ? state.root : roots[0];
  const specs = catalog.filter((entry) => entry.type === root);
  const pages = Math.max(1, Math.ceil(specs.length / PAGE_SIZE));
  const page = Math.min(state.page, pages - 1);
  const pageSpecs = specs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const suffix = `${root}_${page}_${state.purpose}`;

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### コマンド制限"),
      new TextDisplayBuilder().setContent(commandStatus(data)),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(areaRow(state))
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        (Object.keys(COMMAND_CONTROL_MODE_LABELS) as CommandControlMode[]).map((mode) =>
          new ButtonBuilder()
            .setCustomId(`botfixer_mode_${mode}_${suffix}`)
            .setLabel(`${COMMAND_CONTROL_MODE_LABELS[mode]}${data.mode === mode ? "（現在）" : ""}`)
            .setStyle(data.mode === mode ? ButtonStyle.Primary : ButtonStyle.Secondary),
        ),
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`botfixer_root_${state.purpose}`)
          .setPlaceholder("対象の種類（カテゴリ）")
          .addOptions(
            roots.map((type) => ({
              label: TYPE_LABELS[type] ?? type,
              value: type,
              default: type === root,
            })),
          ),
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`botfixer_action_${suffix}`)
          .setPlaceholder(
            state.purpose === "rate"
              ? "レート制限を設定するコマンド"
              : "対象リストに追加／削除するコマンド",
          )
          .addOptions(
            pageSpecs.map((entry) => {
              let description: string;
              if (state.purpose === "rate") {
                const rule = data.rates[entry.name];
                description = rule
                  ? `${rule.count}回 / ${Math.floor(rule.windowSeconds / 60)}分`
                  : "レート制限なし";
              } else {
                description = data.actions.includes(entry.name)
                  ? "対象リストに登録済み"
                  : entry.description || entry.name;
              }
              return {
                label: `/${entry.name}`.slice(0, 100),
                value: entry.name,
                description: description.slice(0, 100),
              };
            }),
          ),
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`botfixer_page_${root}_${page - 1}_${state.purpose}`)
          .setLabel("前へ")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page <= 0),
        new ButtonBuilder()
          .setCustomId(`botfixer_page_${root}_${page + 1}_${state.purpose}`)
          .setLabel("次へ")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= pages - 1),
        new ButtonBuilder()
          .setCustomId(
            `botfixer_purpose_${root}_${page}_${state.purpose === "rate" ? "list" : "rate"}`,
          )
          .setLabel(state.purpose === "rate" ? "対象リストを編集" : "レート制限を設定")
          .setStyle(ButtonStyle.Secondary),
      ),
    );
}

function buildBotArea(
  container: ContainerBuilder,
  entries: BotControlEntry[],
  state: BotFixerUiState,
  botNames: Map<string, string>,
): void {
  const lines: string[] = [];
  if (entries.length === 0) {
    lines.push("対象のボットは登録されていません。");
  } else {
    for (const entry of entries) {
      const name = botNames.get(entry.botId) ?? `ID: ${entry.botId}`;
      const channels = entry.channelIds.map((id) => `<#${id}>`).join("、");
      const rate = entry.rate
        ? `${entry.rate.count}回/${Math.floor(entry.rate.windowSeconds / 60)}分`
        : "なし";
      lines.push(`**${name}** 許可: ${channels}／レート: ${rate}`);
    }
  }
  if (state.botTargetId) {
    lines.push(`\n編集中: <@${state.botTargetId}>`);
  } else {
    lines.push("\nボットを選ぶと、そのボットの許可チャンネルとレート制限を編集できます。");
  }

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### 他ボット制限"),
      new TextDisplayBuilder().setContent(lines.join("\n")),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(areaRow(state))
    .addActionRowComponents(
      new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId("botfixer_botuser")
          .setPlaceholder("制限するボットを選択"),
      ),
    );

  if (state.botTargetId) {
    const entry = entries.find((candidate) => candidate.botId === state.botTargetId);
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId(`botfixer_botchannels_${state.botTargetId}`)
      .setPlaceholder("発言を許可するチャンネル（1件以上）")
      .setChannelTypes([ChannelType.GuildText])
      .setMinValues(1)
      .setMaxValues(25);
    if (entry && entry.channelIds.length > 0) {
      channelSelect.setDefaultChannels(entry.channelIds);
    }
    container.addActionRowComponents(
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect),
    );
    const buttons = [
      new ButtonBuilder()
        .setCustomId(`botfixer_botrate_${state.botTargetId}`)
        .setLabel("レート制限を設定")
        .setStyle(ButtonStyle.Secondary),
    ];
    if (entry) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`botfixer_botremove_${state.botTargetId}`)
          .setLabel("対象から外す")
          .setStyle(ButtonStyle.Danger),
      );
    }
    container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
  }
}

export function buildBotFixerPanel(
  data: CommandControlData,
  entries: BotControlEntry[],
  catalog: CatalogEntry[],
  state: BotFixerUiState,
  botNames: Map<string, string>,
  notice?: string,
): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(Colors.Red);
  if (notice) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(notice));
  }
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent("## BOT fixer"));
  if (state.area === "bot") {
    buildBotArea(container, entries, state, botNames);
  } else {
    buildCommandArea(container, data, catalog, state);
  }
  return container;
}
