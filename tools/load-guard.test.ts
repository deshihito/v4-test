import { describe, expect, mock, test } from "bun:test";
import TtlCache from "../src/util/ttlCache";
import InFlight from "../src/util/inFlight";

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
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("TtlCache", () => {
  test("期限内はヒットし、期限切れでミスになる", () => {
    const clock = manualClock();
    const cache = new TtlCache<string>(60_000, clock.now);
    cache.set("k", "v");
    clock.advance(59_999);
    expect(cache.get("k")).toBe("v");
    clock.advance(1);
    expect(cache.get("k")).toBeUndefined();
  });

  test("delete で破棄される", () => {
    const cache = new TtlCache<string>(60_000, manualClock().now);
    cache.set("k", "v");
    cache.delete("k");
    expect(cache.get("k")).toBeUndefined();
  });

  test("deletePrefix は接頭辞が一致するキーだけを破棄する", () => {
    const cache = new TtlCache<string>(60_000, manualClock().now);
    cache.set("g1:c1", "a");
    cache.set("g1:c2", "b");
    cache.set("g12:c1", "c");
    cache.deletePrefix("g1:");
    expect(cache.get("g1:c1")).toBeUndefined();
    expect(cache.get("g1:c2")).toBeUndefined();
    expect(cache.get("g12:c1")).toBe("c");
  });

  test("clear で全件破棄される", () => {
    const cache = new TtlCache<string>(60_000, manualClock().now);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });

  test("空配列も値として保持される", () => {
    const cache = new TtlCache<string[]>(60_000, manualClock().now);
    cache.set("k", []);
    expect(cache.get("k")).toEqual([]);
  });

  test("getOrLoad は期限内は loader を1回だけ呼び、破棄後に再読込する", async () => {
    const clock = manualClock();
    const cache = new TtlCache<string>(60_000, clock.now);
    let calls = 0;
    const load = async () => {
      calls++;
      return `v${calls}`;
    };
    expect(await cache.getOrLoad("k", load)).toBe("v1");
    expect(await cache.getOrLoad("k", load)).toBe("v1");
    expect(calls).toBe(1);
    cache.delete("k");
    expect(await cache.getOrLoad("k", load)).toBe("v2");
    expect(calls).toBe(2);
    clock.advance(60_000);
    expect(await cache.getOrLoad("k", load)).toBe("v3");
    expect(calls).toBe(3);
  });

  test("getOrLoad は空配列の結果もキャッシュする (negative cache)", async () => {
    const cache = new TtlCache<string[]>(60_000, manualClock().now);
    let calls = 0;
    const load = async () => {
      calls++;
      return [] as string[];
    };
    expect(await cache.getOrLoad("k", load)).toEqual([]);
    expect(await cache.getOrLoad("k", load)).toEqual([]);
    expect(calls).toBe(1);
  });
});

describe("InFlight", () => {
  test("処理中の同キーは skipped になり、別キーは実行される", async () => {
    const guard = new InFlight();
    const gate = deferred<string>();
    let runs = 0;
    const first = guard.runExclusive("k", async () => {
      runs++;
      return gate.promise;
    });
    const second = await guard.runExclusive("k", async () => {
      runs++;
      return "other";
    });
    expect(second).toEqual({ skipped: true });
    expect(runs).toBe(1);

    const otherKey = await guard.runExclusive("other", async () => {
      runs++;
      return "ran";
    });
    expect(otherKey).toEqual({ skipped: false, value: "ran" });

    gate.resolve("done");
    await expect(first).resolves.toEqual({ skipped: false, value: "done" });
  });

  test("完了後は同キーでも再実行できる", async () => {
    const guard = new InFlight();
    await guard.runExclusive("k", async () => 1);
    const again = await guard.runExclusive("k", async () => 2);
    expect(again).toEqual({ skipped: false, value: 2 });
  });

  test("例外時もキーが解放される", async () => {
    const guard = new InFlight();
    await expect(
      guard.runExclusive("k", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    const after = await guard.runExclusive("k", async () => "ok");
    expect(after).toEqual({ skipped: false, value: "ok" });
  });
});

const fakeDb = {
  autoReactRow: null as { emojis: string } | null,
  autoFindUniqueCalls: 0,
  binjouSettingRow: null as { thinking?: boolean; thumbsup?: boolean } | null,
  binjouSettingFindCalls: 0,
  binjouRules: [] as { source: string; sourceKey: string; target: string }[],
  binjouRulesFindCalls: 0,
};

mock.module("@/Models/db", () => ({
  prisma: {
    autoReactChannel: {
      findUnique: async () => {
        fakeDb.autoFindUniqueCalls++;
        return fakeDb.autoReactRow;
      },
      upsert: async (args: { create: { emojis: string } }) => {
        fakeDb.autoReactRow = { emojis: args.create.emojis };
      },
      deleteMany: async () => {
        fakeDb.autoReactRow = null;
      },
    },
    binjouSetting: {
      findUnique: async () => {
        fakeDb.binjouSettingFindCalls++;
        return fakeDb.binjouSettingRow;
      },
      upsert: async (args: {
        create: { thinking?: boolean; thumbsup?: boolean };
        update: { thinking?: boolean; thumbsup?: boolean };
      }) => {
        fakeDb.binjouSettingRow = { ...fakeDb.binjouSettingRow, ...args.update };
      },
    },
    binjouRule: {
      findMany: async () => {
        fakeDb.binjouRulesFindCalls++;
        return fakeDb.binjouRules;
      },
      findUnique: async (args: { where: { guildId_sourceKey: { sourceKey: string } } }) =>
        fakeDb.binjouRules.find(
          (rule) => rule.sourceKey === args.where.guildId_sourceKey.sourceKey,
        ) ?? null,
      count: async () => fakeDb.binjouRules.length,
      upsert: async (args: {
        create: { source: string; sourceKey: string; target: string };
        update: { source: string; target: string };
      }) => {
        const existing = fakeDb.binjouRules.find(
          (rule) => rule.sourceKey === args.create.sourceKey,
        );
        if (existing) {
          existing.source = args.update.source;
          existing.target = args.update.target;
        } else {
          fakeDb.binjouRules.push({ ...args.create });
        }
      },
      deleteMany: async (args: { where: { sourceKey: string } }) => {
        fakeDb.binjouRules = fakeDb.binjouRules.filter(
          (rule) => rule.sourceKey !== args.where.sourceKey,
        );
      },
    },
  },
}));

const { findAutoReactEmojis, setAutoReactEmojis } = await import("@/Models/AutoReact");
const { deleteBinjouRule, findBinjouSetting, listBinjouRules, setBinjouEnabled, upsertBinjouRule } =
  await import("@/Models/Binjou");

describe("AutoReact キャッシュ", () => {
  test("未設定チャンネルは空配列がキャッシュされ DB を毎回引かない", async () => {
    fakeDb.autoReactRow = null;
    const before = fakeDb.autoFindUniqueCalls;
    expect(await findAutoReactEmojis("g-neg", "c1")).toEqual([]);
    expect(await findAutoReactEmojis("g-neg", "c1")).toEqual([]);
    expect(fakeDb.autoFindUniqueCalls).toBe(before + 1);
  });

  test("setAutoReactEmojis でキャッシュが破棄され即時反映される", async () => {
    fakeDb.autoReactRow = { emojis: JSON.stringify(["🎉"]) };
    expect(await findAutoReactEmojis("g-set", "c1")).toEqual(["🎉"]);
    const before = fakeDb.autoFindUniqueCalls;
    expect(await findAutoReactEmojis("g-set", "c1")).toEqual(["🎉"]);
    expect(fakeDb.autoFindUniqueCalls).toBe(before);

    await setAutoReactEmojis("g-set", "c1", ["🔥", "👍"]);
    expect(await findAutoReactEmojis("g-set", "c1")).toEqual(["🔥", "👍"]);
    expect(fakeDb.autoFindUniqueCalls).toBe(before + 1);
  });

  test("空配列での set は削除として反映される", async () => {
    fakeDb.autoReactRow = { emojis: JSON.stringify(["🎉"]) };
    expect(await findAutoReactEmojis("g-del", "c1")).toEqual(["🎉"]);
    await setAutoReactEmojis("g-del", "c1", []);
    expect(fakeDb.autoReactRow).toBeNull();
    expect(await findAutoReactEmojis("g-del", "c1")).toEqual([]);
  });
});

describe("Binjou キャッシュ", () => {
  test("設定はキャッシュされ DB を毎回引かない", async () => {
    fakeDb.binjouSettingRow = null;
    const before = fakeDb.binjouSettingFindCalls;
    expect(await findBinjouSetting("b-def")).toEqual({ thinking: true, thumbsup: true });
    expect(await findBinjouSetting("b-def")).toEqual({ thinking: true, thumbsup: true });
    expect(fakeDb.binjouSettingFindCalls).toBe(before + 1);
  });

  test("setBinjouEnabled で設定とルールの両キャッシュが破棄される", async () => {
    fakeDb.binjouSettingRow = { thinking: true, thumbsup: true };
    fakeDb.binjouRules = [{ source: "a", sourceKey: "a", target: "b" }];
    expect(await findBinjouSetting("b-set")).toEqual({ thinking: true, thumbsup: true });
    expect(await listBinjouRules("b-set")).toHaveLength(1);
    const settingBefore = fakeDb.binjouSettingFindCalls;
    const rulesBefore = fakeDb.binjouRulesFindCalls;
    await findBinjouSetting("b-set");
    await listBinjouRules("b-set");
    expect(fakeDb.binjouSettingFindCalls).toBe(settingBefore);
    expect(fakeDb.binjouRulesFindCalls).toBe(rulesBefore);

    await setBinjouEnabled("b-set", "thinking", false);
    expect(await findBinjouSetting("b-set")).toEqual({ thinking: false, thumbsup: true });
    await listBinjouRules("b-set");
    expect(fakeDb.binjouSettingFindCalls).toBe(settingBefore + 1);
    expect(fakeDb.binjouRulesFindCalls).toBe(rulesBefore + 1);
  });

  test("upsertBinjouRule / deleteBinjouRule が即時反映される", async () => {
    fakeDb.binjouRules = [];
    expect(await listBinjouRules("b-rules")).toEqual([]);
    await upsertBinjouRule("b-rules", { key: "x", display: "x" }, { key: "y", display: "y" });
    expect(await listBinjouRules("b-rules")).toEqual([
      { source: "x", sourceKey: "x", target: "y" },
    ]);
    await deleteBinjouRule("b-rules", "x");
    expect(await listBinjouRules("b-rules")).toEqual([]);
  });
});
