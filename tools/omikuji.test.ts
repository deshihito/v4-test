import { describe, expect, test } from "bun:test";
import {
  FORMATS,
  ITEMS,
  ITEM_TEXTS,
  RANKS,
  SUMMARIES,
  WAKA,
  drawDailyFortune,
  drawRecord,
  fortuneFromRecord,
  jstDateString,
  seededRng,
} from "../src/Views/omikujiFortunes";
import { OMIKUJI_THEMES, kanjiNumber, renderOmikujiCard } from "../src/Views/omikujiCard";

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
const charCount = (text: string) => [...text.replace(/[\s　]/g, "")].length;

describe("フォーマットと運勢の重み", () => {
  test("フォーマットは12種で重みの合計が100", () => {
    expect(FORMATS.length).toBe(12);
    expect(new Set(FORMATS.map((f) => f.id)).size).toBe(12);
    expect(new Set(FORMATS.map((f) => f.name)).size).toBe(12);
    expect(sum(FORMATS.map((f) => f.weight))).toBe(100);
  });

  test("各フォーマットの運勢テーブルは12段で合計100", () => {
    for (const format of FORMATS) {
      expect(format.rankWeights.length).toBe(12);
      expect(sum(format.rankWeights)).toBe(100);
    }
  });

  test("12フォーマット全てにカードテーマがある", () => {
    for (const format of FORMATS) {
      expect(OMIKUJI_THEMES[format.id]).toBeDefined();
    }
  });
});

describe("文面プール", () => {
  test("和歌と総合は全ランク3件ずつ", () => {
    for (const rank of RANKS) {
      expect(WAKA[rank].length).toBe(3);
      expect(SUMMARIES[rank].length).toBe(3);
    }
  });

  test("項目別は全ランク×10項目×3件", () => {
    for (const rank of RANKS) {
      for (const item of ITEMS) {
        expect(ITEM_TEXTS[rank][item].length).toBe(3);
      }
    }
  });

  test("札レイアウトの文字数上限（和歌・項目別）を守る", () => {
    for (const rank of RANKS) {
      for (const [upper, lower] of WAKA[rank]) {
        expect(charCount(upper)).toBeLessThanOrEqual(17);
        expect(charCount(lower)).toBeLessThanOrEqual(14);
      }
      for (const item of ITEMS) {
        for (const text of ITEM_TEXTS[rank][item]) {
          expect(charCount(text)).toBeLessThanOrEqual(16);
        }
      }
    }
  });
});

describe("抽選", () => {
  test("同一シードでは必ず同じ結果になる（日次固定の再現）", () => {
    const a = drawDailyFortune("guild-1", "user-1", "2026-11-13");
    const b = drawDailyFortune("guild-1", "user-1", "2026-11-13");
    expect(a).toEqual(b);
  });

  test("抽選結果が範囲内に収まる", () => {
    for (let i = 0; i < 200; i++) {
      const record = drawRecord(seededRng(`seed-${i}`));
      expect(FORMATS.map((f) => f.id)).toContain(record.format);
      expect(RANKS).toContain(record.rank);
      expect(record.number).toBeGreaterThanOrEqual(1);
      expect(record.number).toBeLessThanOrEqual(100);
      expect(record.itemIndices.length).toBe(10);
    }
  });

  test("記録→文面の解決が往復で一致する（保存済み再表示）", () => {
    const fortune = drawDailyFortune("guild-2", "user-9", "2026-01-01");
    const restored = fortuneFromRecord({
      format: fortune.format,
      number: fortune.number,
      rank: fortune.rank,
      wakaIndex: fortune.wakaIndex,
      summaryIndex: fortune.summaryIndex,
      itemIndices: fortune.itemIndices,
    });
    expect(restored).toEqual(fortune);
  });

  test("重み0のランクはそのフォーマットで出ない", () => {
    const silk = FORMATS.find((f) => f.id === "silk")!;
    for (let i = 0; i < 300; i++) {
      const rng = seededRng(`silk-${i}`);
      // フォーマット抽選を経ず運勢だけを繰り返し確認するため、
      // drawRecord の結果が silk のときだけ検証する
      const record = drawRecord(rng);
      if (record.format === "silk") {
        expect(RANKS.indexOf(record.rank)).toBeLessThan(9);
      }
    }
    expect(silk.rankWeights.slice(9)).toEqual([0, 0, 0]);
  });
});

describe("日付と漢数字", () => {
  test("JST 日付は UTC+9 で切り替わる", () => {
    expect(jstDateString(new Date(Date.UTC(2026, 0, 1, 14, 59)))).toBe("2026-01-01");
    expect(jstDateString(new Date(Date.UTC(2026, 0, 1, 15, 0)))).toBe("2026-01-02");
  });

  test("漢数字表記", () => {
    expect(kanjiNumber(1)).toBe("一");
    expect(kanjiNumber(10)).toBe("十");
    expect(kanjiNumber(11)).toBe("十一");
    expect(kanjiNumber(23)).toBe("二十三");
    expect(kanjiNumber(100)).toBe("百");
  });
});

describe("カード描画", () => {
  test("12フォーマット全種で PNG が返る", async () => {
    for (const format of FORMATS) {
      const fortune = fortuneFromRecord({
        format: format.id,
        number: 7,
        rank: "大吉",
        wakaIndex: 0,
        summaryIndex: 0,
        itemIndices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      });
      const png = await renderOmikujiCard(fortune);
      expect(png).not.toBeNull();
      expect(png!.length).toBeGreaterThan(10000);
      // PNG シグネチャ
      expect([...png!.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    }
  });

  test("3文字ランク（末小吉）でも描画できる", async () => {
    const fortune = fortuneFromRecord({
      format: "ink",
      number: 100,
      rank: "末小吉",
      wakaIndex: 2,
      summaryIndex: 2,
      itemIndices: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    });
    const png = await renderOmikujiCard(fortune);
    expect(png).not.toBeNull();
  });
});
