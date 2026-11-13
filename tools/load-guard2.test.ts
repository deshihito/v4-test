import { describe, expect, mock, test } from "bun:test";
import LevelGrantStore from "../src/util/levelGrantStore";

function manualClock(start = 0) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("LevelGrantStore", () => {
  test("間隔内はスキップされ、間隔を過ぎると通過する", () => {
    const clock = manualClock(1_000_000);
    const store = new LevelGrantStore(300_000, 10_000, clock.now);
    expect(store.isThrottled("u1", "g1")).toBe(false);
    store.record("u1", "g1");
    expect(store.isThrottled("u1", "g1")).toBe(true);
    clock.advance(299_999);
    expect(store.isThrottled("u1", "g1")).toBe(true);
    clock.advance(1);
    expect(store.isThrottled("u1", "g1")).toBe(false);
  });

  test("ユーザー・ギルド単位で独立している", () => {
    const store = new LevelGrantStore(300_000, 10_000, manualClock().now);
    store.record("u1", "g1");
    expect(store.isThrottled("u1", "g2")).toBe(false);
    expect(store.isThrottled("u2", "g1")).toBe(false);
  });

  test("過去時刻で record すると DB 時刻基準で判定できる", () => {
    const clock = manualClock(1_000_000);
    const store = new LevelGrantStore(300_000, 10_000, clock.now);
    store.record("u1", "g1", 800_000);
    expect(store.isThrottled("u1", "g1")).toBe(true);
    store.record("u2", "g1", 600_000);
    expect(store.isThrottled("u2", "g1")).toBe(false);
  });

  test("forget でエントリが消える", () => {
    const store = new LevelGrantStore(300_000, 10_000, manualClock().now);
    store.record("u1", "g1");
    store.forget("u1", "g1");
    expect(store.isThrottled("u1", "g1")).toBe(false);
  });

  test("上限超過時に期限切れエントリが掃除される", () => {
    const clock = manualClock(0);
    const store = new LevelGrantStore(1_000, 2, clock.now);
    store.record("a", "g");
    store.record("b", "g");
    expect(store.size).toBe(2);
    clock.advance(2_000);
    store.record("c", "g");
    expect(store.size).toBe(1);
    expect(store.isThrottled("c", "g")).toBe(true);
    expect(store.isThrottled("a", "g")).toBe(false);
  });
});

type Row = Record<string, unknown>;

const calls: Record<string, number> = {};
function counted(name: string): void {
  calls[name] = (calls[name] ?? 0) + 1;
}
function callCount(name: string): number {
  return calls[name] ?? 0;
}

const state = {
  honeypot: new Map<string, Row>(),
  sticky: new Map<string, Row>(),
  pin: new Map<string, Row>(),
  hiroyuki: [] as Row[],
  globalChat: [] as Row[],
  admin: new Set<string>(),
  afk: new Map<string, Row>(),
  ccSetting: new Map<string, Row>(),
  ccActions: [] as Row[],
  ccRates: [] as Row[],
  botSettings: [] as Row[],
  botChannels: [] as Row[],
  guildStats: new Map<string, Row>(),
  statsUpdateFail: new Set<string>(),
};

const fakePrisma = {
  honeypotSetting: {
    findUnique: async ({ where }: { where: { guildId: string } }) => {
      counted("honeypot.findUnique");
      return state.honeypot.get(where.guildId) ?? null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { guildId: string };
      create: Row;
      update: Row;
    }) => {
      const row = { ...(state.honeypot.get(where.guildId) ?? {}), ...create, ...update };
      state.honeypot.set(where.guildId, row);
      return row;
    },
    update: async ({ where, data }: { where: { guildId: string }; data: Row }) => {
      const row = { ...(state.honeypot.get(where.guildId) ?? {}), ...data };
      state.honeypot.set(where.guildId, row);
      return row;
    },
  },
  stickySetting: {
    findUnique: async ({ where }: { where: { guildId: string } }) => {
      counted("sticky.findUnique");
      return state.sticky.get(where.guildId) ?? null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { guildId: string };
      create: Row;
      update: Row;
    }) => {
      const row = {
        channelId: null,
        messageId: null,
        content: "",
        enabled: false,
        ...(state.sticky.get(where.guildId) ?? {}),
        ...create,
        ...update,
      };
      state.sticky.set(where.guildId, row);
      return row;
    },
    update: async ({ where, data }: { where: { guildId: string }; data: Row }) => {
      const row = { ...(state.sticky.get(where.guildId) ?? {}), ...data };
      state.sticky.set(where.guildId, row);
      return row;
    },
  },
  pin: {
    findUnique: async ({ where }: { where: { channelId: string } }) => {
      counted("pin.findUnique");
      return state.pin.get(where.channelId) ?? null;
    },
    create: async ({ data }: { data: Row }) => {
      counted("pin.create");
      state.pin.set(data.channelId as string, { ...data });
      return data;
    },
    update: async ({ where, data }: { where: { channelId: string }; data: Row }) => {
      counted("pin.update");
      const row = { ...(state.pin.get(where.channelId) ?? {}), ...data };
      state.pin.set(where.channelId, row);
      return row;
    },
    delete: async ({ where }: { where: { channelId: string } }) => {
      counted("pin.delete");
      const row = state.pin.get(where.channelId) ?? null;
      state.pin.delete(where.channelId);
      return row;
    },
    count: async () => state.pin.size,
    findMany: async () => [...state.pin.values()],
  },
  hiroyuki: {
    findFirst: async ({ where }: { where: { channelId?: string; guildId?: string } }) => {
      counted("hiroyuki.findFirst");
      return (
        state.hiroyuki.find(
          (row) =>
            (where.channelId === undefined || row.channelId === where.channelId) &&
            (where.guildId === undefined || row.guildId === where.guildId),
        ) ?? null
      );
    },
    create: async ({ data }: { data: Row }) => {
      counted("hiroyuki.create");
      state.hiroyuki.push({ ...data });
      return data;
    },
    delete: async ({ where }: { where: { guildId: string } }) => {
      counted("hiroyuki.delete");
      state.hiroyuki = state.hiroyuki.filter((row) => row.guildId !== where.guildId);
      return {};
    },
    deleteMany: async ({ where }: { where: { guildId: string } }) => {
      counted("hiroyuki.deleteMany");
      const before = state.hiroyuki.length;
      state.hiroyuki = state.hiroyuki.filter((row) => row.guildId !== where.guildId);
      return { count: before - state.hiroyuki.length };
    },
  },
  globalChat: {
    findFirst: async ({ where }: { where: { channelId: string } }) => {
      counted("gc.findFirst");
      return state.globalChat.find((row) => row.channelId === where.channelId) ?? null;
    },
    findUnique: async ({ where }: { where: { guildId: string } }) => {
      counted("gc.findUnique");
      return state.globalChat.find((row) => row.guildId === where.guildId) ?? null;
    },
    findMany: async () => {
      counted("gc.findMany");
      return [...state.globalChat];
    },
    create: async ({ data }: { data: Row }) => {
      counted("gc.create");
      state.globalChat.push({ ...data });
      return data;
    },
    delete: async ({ where }: { where: { guildId: string } }) => {
      counted("gc.delete");
      state.globalChat = state.globalChat.filter((row) => row.guildId !== where.guildId);
      return {};
    },
    count: async () => state.globalChat.length,
  },
  admin: {
    findFirst: async ({ where }: { where: { userId: string } }) => {
      counted("admin.findFirst");
      return state.admin.has(where.userId) ? { userId: where.userId } : null;
    },
    findUnique: async ({ where }: { where: { userId: string } }) =>
      state.admin.has(where.userId) ? { userId: where.userId } : null,
    create: async ({ data }: { data: { userId: string } }) => {
      counted("admin.create");
      state.admin.add(data.userId);
      return data;
    },
    delete: async ({ where }: { where: { userId: string } }) => {
      counted("admin.delete");
      state.admin.delete(where.userId);
      return {};
    },
  },
  afk: {
    findUnique: async ({ where }: { where: { userId: string } }) => {
      counted("afk.findUnique");
      return state.afk.get(where.userId) ?? null;
    },
    create: async ({ data }: { data: Row }) => {
      counted("afk.create");
      const row = { mention: 0, ...data };
      state.afk.set(data.userId as string, row);
      return row;
    },
    delete: async ({ where }: { where: { userId: string } }) => {
      counted("afk.delete");
      const row = state.afk.get(where.userId) ?? null;
      state.afk.delete(where.userId);
      return row;
    },
    update: async ({ where }: { where: { userId: string } }) => {
      counted("afk.update");
      const row = state.afk.get(where.userId);
      if (row) row.mention = (row.mention as number) + 1;
      return row ?? null;
    },
  },
  commandControlSetting: {
    findUnique: async ({ where }: { where: { guildId: string } }) => {
      counted("ccSetting.findUnique");
      return state.ccSetting.get(where.guildId) ?? null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { guildId: string };
      create: Row;
      update: Row;
    }) => {
      const row = { ...(state.ccSetting.get(where.guildId) ?? {}), ...create, ...update };
      state.ccSetting.set(where.guildId, row);
      return row;
    },
  },
  commandControlAction: {
    findMany: async ({ where }: { where: { guildId: string } }) => {
      counted("ccAction.findMany");
      return state.ccActions.filter((row) => row.guildId === where.guildId);
    },
    findUnique: async ({
      where,
    }: {
      where: { guildId_command: { guildId: string; command: string } };
    }) => {
      counted("ccAction.findUnique");
      return (
        state.ccActions.find(
          (row) =>
            row.guildId === where.guildId_command.guildId &&
            row.command === where.guildId_command.command,
        ) ?? null
      );
    },
    delete: async ({ where }: { where: { id: number } }) => {
      counted("ccAction.delete");
      state.ccActions = state.ccActions.filter((row) => row.id !== where.id);
      return {};
    },
    create: async ({ data }: { data: Row }) => {
      counted("ccAction.create");
      const row = { id: state.ccActions.length + 100, ...data };
      state.ccActions.push(row);
      return row;
    },
  },
  commandControlRate: {
    findMany: async ({ where }: { where: { guildId: string } }) => {
      counted("ccRate.findMany");
      return state.ccRates.filter((row) => row.guildId === where.guildId);
    },
    deleteMany: async ({ where }: { where: { guildId: string; command: string } }) => {
      counted("ccRate.deleteMany");
      state.ccRates = state.ccRates.filter(
        (row) => !(row.guildId === where.guildId && row.command === where.command),
      );
      return { count: 0 };
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { guildId_command: { guildId: string; command: string } };
      create: Row;
      update: Row;
    }) => {
      const key = where.guildId_command;
      const existing = state.ccRates.find(
        (row) => row.guildId === key.guildId && row.command === key.command,
      );
      if (existing) Object.assign(existing, update);
      else state.ccRates.push({ ...create });
      return {};
    },
  },
  botControlSetting: {
    findMany: async ({ where }: { where: { guildId: string } }) => {
      counted("botSetting.findMany");
      return state.botSettings.filter((row) => row.guildId === where.guildId);
    },
    upsert: async ({
      where,
      create,
    }: {
      where: { guildId_botId: { guildId: string; botId: string } };
      create: Row;
      update: Row;
    }) => {
      const key = where.guildId_botId;
      if (
        !state.botSettings.some((row) => row.guildId === key.guildId && row.botId === key.botId)
      ) {
        state.botSettings.push({ rateCount: null, rateWindowSeconds: null, ...create });
      }
      return {};
    },
    update: async ({
      where,
      data,
    }: {
      where: { guildId_botId: { guildId: string; botId: string } };
      data: Row;
    }) => {
      counted("botSetting.update");
      const key = where.guildId_botId;
      const row = state.botSettings.find((r) => r.guildId === key.guildId && r.botId === key.botId);
      if (row) Object.assign(row, data);
      return row ?? {};
    },
    deleteMany: async ({ where }: { where: { guildId: string; botId: string } }) => {
      state.botSettings = state.botSettings.filter(
        (row) => !(row.guildId === where.guildId && row.botId === where.botId),
      );
      return { count: 0 };
    },
  },
  botControlChannel: {
    findMany: async ({ where }: { where: { guildId: string } }) => {
      counted("botChannel.findMany");
      return state.botChannels.filter((row) => row.guildId === where.guildId);
    },
    deleteMany: async ({ where }: { where: { guildId: string; botId: string } }) => {
      state.botChannels = state.botChannels.filter(
        (row) => !(row.guildId === where.guildId && row.botId === where.botId),
      );
      return { count: 0 };
    },
    createMany: async ({ data }: { data: Row[] }) => {
      state.botChannels.push(...data);
      return { count: data.length };
    },
  },
  guildStatistics: {
    findUnique: async ({ where }: { where: { guildId: string } }) => {
      counted("stats.findUnique");
      return state.guildStats.get(where.guildId) ?? null;
    },
    create: async ({ data }: { data: Row }) => {
      counted("stats.create");
      const row = { totalMessage: 0, totalJoin: 0, totalLeave: 0, ...data };
      state.guildStats.set(data.guildId as string, row);
      return row;
    },
    delete: async ({ where }: { where: { guildId: string } }) => {
      counted("stats.delete");
      const row = state.guildStats.get(where.guildId) ?? null;
      state.guildStats.delete(where.guildId);
      return row;
    },
    update: async ({ where, data }: { where: { guildId: string }; data: Row }) => {
      counted("stats.update");
      if (state.statsUpdateFail.has(where.guildId)) throw new Error("db down");
      const row = state.guildStats.get(where.guildId);
      if (!row) throw new Error("not found");
      const total = data.totalMessage as { increment: number } | undefined;
      if (total) row.totalMessage = (row.totalMessage as number) + total.increment;
      return row;
    },
    updateMany: async () => ({ count: 0 }),
  },
};

mock.module("@/Models/db", () => ({ prisma: fakePrisma }));

const { findHoneypotSetting, setHoneypotChannel, setHoneypotMessageId } =
  await import("@/Models/Honeypot");
const { findStickySetting, resendStickyPanel, setStickyContent } = await import("@/Models/Sticky");
const { createPin, deletePin, findPin, updatePinMessageId } = await import("@/Models/Pin");
const { createHiroyuki, findHiroyukiByChannelId } = await import("@/Models/Hiroyuki");
const { createGlobalChat, deleteGlobalChatByGuildId, findGlobalChatByChannelId, listGlobalChats } =
  await import("@/Models/GlobalChat");
const isAdmin = (await import("@/Models/isAdmin")).default;
const { createAdmin, deleteAdminByUserId } = await import("@/Models/Admin");
const { createAfk, deleteAfk, findAfk } = await import("@/Models/Afk");
const { getBotControl, getCommandControl, setBotControlRate, setCommandControlMode } =
  await import("@/Models/BotFixer");
const {
  createGuildStatistics,
  deleteGuildStatistics,
  existsGuildStatistics,
  flushGuildStatisticsMessages,
  pendingGuildStatisticsMessages,
  queueGuildStatisticsMessage,
} = await import("@/Models/GuildStatistics");

describe("Honeypot キャッシュ", () => {
  test("未設定はデフォルトがキャッシュされ DB を毎回引かない", async () => {
    const before = callCount("honeypot.findUnique");
    expect(await findHoneypotSetting("h-none")).toEqual({
      enabled: false,
      channelId: null,
      messageId: null,
    });
    expect(await findHoneypotSetting("h-none")).toEqual({
      enabled: false,
      channelId: null,
      messageId: null,
    });
    expect(callCount("honeypot.findUnique")).toBe(before + 1);
  });

  test("setHoneypotChannel が即時反映される", async () => {
    await findHoneypotSetting("h-set");
    await setHoneypotChannel("h-set", "c9");
    const before = callCount("honeypot.findUnique");
    expect(await findHoneypotSetting("h-set")).toEqual({
      enabled: true,
      channelId: "c9",
      messageId: null,
    });
    expect(callCount("honeypot.findUnique")).toBe(before + 1);
  });

  test("setHoneypotMessageId はキャッシュを更新し再読込しない", async () => {
    state.honeypot.set("h-msg", { enabled: true, channelId: "c1", messageId: "old" });
    expect((await findHoneypotSetting("h-msg")).messageId).toBe("old");
    await setHoneypotMessageId("h-msg", "new");
    const before = callCount("honeypot.findUnique");
    expect((await findHoneypotSetting("h-msg")).messageId).toBe("new");
    expect(callCount("honeypot.findUnique")).toBe(before);
  });
});

describe("Sticky キャッシュ", () => {
  test("未設定はデフォルトがキャッシュされる", async () => {
    const before = callCount("sticky.findUnique");
    await findStickySetting("s-none");
    await findStickySetting("s-none");
    expect(callCount("sticky.findUnique")).toBe(before + 1);
  });

  test("setStickyContent が即時反映される", async () => {
    await findStickySetting("s-set");
    await setStickyContent("s-set", "本文");
    expect((await findStickySetting("s-set")).content).toBe("本文");
  });
});

describe("Sticky 再送の合体", () => {
  test("実行中の再送がある間は次の再送がスキップされる", async () => {
    state.sticky.set("s-resend", {
      guildId: "s-resend",
      channelId: "c1",
      messageId: null,
      content: "固定文",
      enabled: true,
    });

    const gate = deferred<{ id: string }>();
    let sendCalls = 0;
    let blockSend = true;
    const channel = {
      guildId: "s-resend",
      isSendable: () => true,
      messages: { fetch: async () => null },
      send: async () => {
        sendCalls++;
        if (blockSend) {
          blockSend = false;
          return gate.promise;
        }
        return { id: `m${sendCalls}` };
      },
    };
    const client = {
      channels: { fetch: async () => channel },
    };

    const first = resendStickyPanel(client as never, "s-resend");
    for (let i = 0; i < 100 && sendCalls === 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    expect(sendCalls).toBe(1);

    const second = resendStickyPanel(client as never, "s-resend");
    await second;
    expect(sendCalls).toBe(1);

    gate.resolve({ id: "m1" });
    await first;
    expect(sendCalls).toBe(1);

    await resendStickyPanel(client as never, "s-resend");
    expect(sendCalls).toBe(2);
  });
});

describe("Pin キャッシュ", () => {
  test("未設定は null がキャッシュされる", async () => {
    const before = callCount("pin.findUnique");
    expect(await findPin("p-none")).toBeNull();
    expect(await findPin("p-none")).toBeNull();
    expect(callCount("pin.findUnique")).toBe(before + 1);
  });

  test("createPin / deletePin が即時反映される", async () => {
    await createPin("p-c1", "m1", "g1", "https://example.com/hook");
    expect((await findPin("p-c1"))?.messegeId).toBe("m1");
    await deletePin("p-c1");
    expect(await findPin("p-c1")).toBeNull();
  });

  test("updatePinMessageId はキャッシュを更新し再読込しない", async () => {
    await createPin("p-c2", "m1", "g1", "https://example.com/hook");
    expect((await findPin("p-c2"))?.messegeId).toBe("m1");
    await updatePinMessageId("p-c2", "m2");
    const before = callCount("pin.findUnique");
    expect((await findPin("p-c2"))?.messegeId).toBe("m2");
    expect(callCount("pin.findUnique")).toBe(before);
  });
});

describe("Hiroyuki キャッシュ", () => {
  test("未設定チャンネルは null がキャッシュされる", async () => {
    const before = callCount("hiroyuki.findFirst");
    expect(await findHiroyukiByChannelId("hi-none")).toBeNull();
    expect(await findHiroyukiByChannelId("hi-none")).toBeNull();
    expect(callCount("hiroyuki.findFirst")).toBe(before + 1);
  });

  test("createHiroyuki が即時反映される", async () => {
    expect(await findHiroyukiByChannelId("hi-c1")).toBeNull();
    await createHiroyuki({ channelId: "hi-c1", guildId: "hi-g1", webhookUrl: "https://x" });
    expect((await findHiroyukiByChannelId("hi-c1"))?.guildId).toBe("hi-g1");
  });
});

describe("GlobalChat キャッシュ", () => {
  test("チャンネル判定と一覧がキャッシュされる", async () => {
    const findBefore = callCount("gc.findFirst");
    expect(await findGlobalChatByChannelId("gc-none")).toBeNull();
    expect(await findGlobalChatByChannelId("gc-none")).toBeNull();
    expect(callCount("gc.findFirst")).toBe(findBefore + 1);

    const listBefore = callCount("gc.findMany");
    await listGlobalChats();
    await listGlobalChats();
    expect(callCount("gc.findMany")).toBe(listBefore + 1);
  });

  test("createGlobalChat / deleteGlobalChatByGuildId が即時反映される", async () => {
    expect(await findGlobalChatByChannelId("gc-c1")).toBeNull();
    await createGlobalChat({ channelId: "gc-c1", guildId: "gc-g1", webhookUrl: "https://x" });
    expect((await findGlobalChatByChannelId("gc-c1"))?.guildId).toBe("gc-g1");
    expect(await listGlobalChats()).toHaveLength(1);
    await deleteGlobalChatByGuildId("gc-g1");
    expect(await findGlobalChatByChannelId("gc-c1")).toBeNull();
    expect(await listGlobalChats()).toHaveLength(0);
  });
});

describe("isAdmin キャッシュ", () => {
  test("結果がキャッシュされ、Admin の作成/削除で即時反映される", async () => {
    const before = callCount("admin.findFirst");
    expect(await isAdmin("adm-1")).toBe(false);
    expect(await isAdmin("adm-1")).toBe(false);
    expect(callCount("admin.findFirst")).toBe(before + 1);

    await createAdmin("adm-1");
    expect(await isAdmin("adm-1")).toBe(true);

    await deleteAdminByUserId("adm-1");
    expect(await isAdmin("adm-1")).toBe(false);
  });
});

describe("Afk negative cache", () => {
  test("AFK でないユーザーは DB を毎回引かない", async () => {
    const before = callCount("afk.findUnique");
    expect(await findAfk("afk-none")).toBeNull();
    expect(await findAfk("afk-none")).toBeNull();
    expect(callCount("afk.findUnique")).toBe(before + 1);
  });

  test("createAfk で negative cache が破棄され、正の結果は毎回 DB を読む", async () => {
    expect(await findAfk("afk-u1")).toBeNull();
    await createAfk("afk-u1", "離席中");
    const before = callCount("afk.findUnique");
    expect((await findAfk("afk-u1"))?.message).toBe("離席中");
    expect((await findAfk("afk-u1"))?.message).toBe("離席中");
    expect(callCount("afk.findUnique")).toBe(before + 2);
  });

  test("deleteAfk 後は DB を引かずに null になる", async () => {
    await createAfk("afk-u2", "離席中");
    expect(await findAfk("afk-u2")).not.toBeNull();
    await deleteAfk("afk-u2");
    const before = callCount("afk.findUnique");
    expect(await findAfk("afk-u2")).toBeNull();
    expect(callCount("afk.findUnique")).toBe(before);
  });
});

describe("BotFixer キャッシュ", () => {
  test("getBotControl がキャッシュされ setBotControlRate で破棄される", async () => {
    state.botSettings.push({
      guildId: "bf-g1",
      botId: "b1",
      rateCount: null,
      rateWindowSeconds: null,
    });
    state.botChannels.push({ guildId: "bf-g1", botId: "b1", channelId: "c1" });

    const before = callCount("botSetting.findMany");
    const entries = await getBotControl("bf-g1");
    expect(entries).toHaveLength(1);
    await getBotControl("bf-g1");
    expect(callCount("botSetting.findMany")).toBe(before + 1);

    await setBotControlRate("bf-g1", "b1", { count: 3, windowSeconds: 60 });
    const after = await getBotControl("bf-g1");
    expect(callCount("botSetting.findMany")).toBe(before + 2);
    expect(after[0].rate).toEqual({ count: 3, windowSeconds: 60 });
  });

  test("getCommandControl がキャッシュされ setCommandControlMode で破棄される", async () => {
    const before = callCount("ccSetting.findUnique");
    expect((await getCommandControl("bf-g2")).mode).toBe("off");
    await getCommandControl("bf-g2");
    expect(callCount("ccSetting.findUnique")).toBe(before + 1);

    await setCommandControlMode("bf-g2", "deny");
    expect((await getCommandControl("bf-g2")).mode).toBe("deny");
    expect(callCount("ccSetting.findUnique")).toBe(before + 2);
  });
});

describe("GuildStatistics 存在キャッシュとバッチ化", () => {
  test("存在判定がキャッシュされ create/delete で即時反映される", async () => {
    const before = callCount("stats.findUnique");
    expect(await existsGuildStatistics("st-none")).toBe(false);
    expect(await existsGuildStatistics("st-none")).toBe(false);
    expect(callCount("stats.findUnique")).toBe(before + 1);

    await createGuildStatistics("st-none");
    expect(await existsGuildStatistics("st-none")).toBe(true);

    await deleteGuildStatistics("st-none");
    expect(await existsGuildStatistics("st-none")).toBe(false);
  });

  test("キューした分がフラッシュでまとめて加算される", async () => {
    await createGuildStatistics("st-batch");
    queueGuildStatisticsMessage("st-batch");
    queueGuildStatisticsMessage("st-batch");
    queueGuildStatisticsMessage("st-batch");
    expect(pendingGuildStatisticsMessages().get("st-batch")).toBe(3);

    const before = callCount("stats.update");
    await flushGuildStatisticsMessages();
    expect(callCount("stats.update")).toBe(before + 1);
    expect(state.guildStats.get("st-batch")?.totalMessage).toBe(3);
    expect(pendingGuildStatisticsMessages().size).toBe(0);
  });

  test("フラッシュ失敗分は集計に戻り、次回フラッシュで書き込まれる", async () => {
    await createGuildStatistics("st-fail");
    queueGuildStatisticsMessage("st-fail");
    queueGuildStatisticsMessage("st-fail");
    state.statsUpdateFail.add("st-fail");

    await flushGuildStatisticsMessages();
    expect(state.guildStats.get("st-fail")?.totalMessage).toBe(0);
    expect(pendingGuildStatisticsMessages().get("st-fail")).toBe(2);

    state.statsUpdateFail.delete("st-fail");
    await flushGuildStatisticsMessages();
    expect(state.guildStats.get("st-fail")?.totalMessage).toBe(2);
    expect(pendingGuildStatisticsMessages().size).toBe(0);
  });

  test("空のフラッシュでは DB を書かない", async () => {
    const before = callCount("stats.update");
    await flushGuildStatisticsMessages();
    expect(callCount("stats.update")).toBe(before);
  });
});
