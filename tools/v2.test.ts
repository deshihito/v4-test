import { describe, expect, test } from "bun:test";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  MessageFlags,
} from "discord.js";
import { embedToContainer, embedsToContainers, extractV2Text, v2, v2Json } from "../src/util/v2";

type Json = Record<string, unknown>;

function asJson(value: unknown): Json {
  if (value && typeof (value as { toJSON?: unknown }).toJSON === "function") {
    return (value as { toJSON: () => Json }).toJSON();
  }
  return value as Json;
}

function texts(json: Json): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const record = node as Json;
    if (record.type === 10 && typeof record.content === "string") out.push(record.content);
    if (Array.isArray(record.components)) record.components.forEach(walk);
  };
  walk(json);
  return out;
}

describe("embedToContainer", () => {
  test("title/description/fields/color が落ちる", () => {
    const json = embedToContainer({
      color: Colors.Green,
      title: "タイトル",
      description: "説明文",
      fields: [
        { name: "項目1", value: "値1" },
        { name: "項目2", value: "値2", inline: true },
      ],
    }).toJSON() as unknown as Json;
    expect(json.type).toBe(17);
    expect(json.accent_color).toBe(Colors.Green);
    expect(texts(json)).toEqual(["## タイトル", "説明文", "**項目1**\n値1", "**項目2**\n値2"]);
  });

  test("author/footer/timestamp はテキストになる", () => {
    const json = embedToContainer({
      author: { name: "投稿者", icon_url: "https://example.com/icon.png" },
      description: "本文",
      footer: { text: "フッター", icon_url: "https://example.com/f.png" },
      timestamp: "2026-01-01T00:00:00.000Z",
    }).toJSON() as unknown as Json;
    const all = texts(json);
    expect(all[0]).toBe("投稿者");
    expect(all[1]).toBe("本文");
    expect(all[2]).toContain("フッター");
    expect(all[2]).toContain(`<t:${Math.floor(Date.parse("2026-01-01T00:00:00.000Z") / 1000)}:f>`);
  });

  test("title の url はリンクになる", () => {
    const json = embedToContainer({
      title: "リンク先",
      url: "https://example.com/page",
    }).toJSON() as unknown as Json;
    expect(texts(json)).toEqual(["## [リンク先](https://example.com/page)"]);
  });

  test("thumbnail は Section+Thumbnail、image は MediaGallery になる", () => {
    const json = embedToContainer({
      title: "見出し",
      description: "説明",
      thumbnail: { url: "https://example.com/thumb.png" },
      image: { url: "attachment://levelcard.png" },
    }).toJSON() as unknown as Json;
    const components = json.components as Json[];
    const section = components.find((c) => c.type === 9) as Json;
    expect(section).toBeDefined();
    expect((section.accessory as Json).type).toBe(11);
    expect(((section.accessory as Json).media as Json).url).toBe("https://example.com/thumb.png");
    const gallery = components.find((c) => c.type === 12) as Json;
    expect(gallery).toBeDefined();
    expect(((gallery.items as Json[])[0].media as Json).url).toBe("attachment://levelcard.png");
  });

  test("複数 embed をそれぞれ Container にする", () => {
    const containers = embedsToContainers([
      { title: "1件目", color: Colors.Red },
      { title: "2件目", color: Colors.Blue },
    ]);
    expect(containers).toHaveLength(2);
    expect((containers[0].toJSON() as unknown as Json).accent_color).toBe(Colors.Red);
    expect((containers[1].toJSON() as unknown as Json).accent_color).toBe(Colors.Blue);
  });

  test("空 embed でも Container が空にならない", () => {
    const json = embedToContainer({ color: Colors.White }).toJSON() as unknown as Json;
    expect((json.components as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("v2", () => {
  test("content は先頭 TextDisplay に移り、Ephemeral と V2 フラグが合成される", () => {
    const payload = v2({
      content: "<@&1234567890>",
      embeds: [{ color: Colors.White, title: "通知", description: "本文" }],
      flags: MessageFlags.Ephemeral,
    }) as Json;
    expect(payload.embeds).toBeUndefined();
    expect(payload.content).toBeUndefined();
    expect(Number(payload.flags)).toBe(MessageFlags.Ephemeral | MessageFlags.IsComponentsV2);
    const container = asJson((payload.components as unknown[])[0]);
    expect(texts(container)).toEqual(["<@&1234567890>", "## 通知", "本文"]);
  });

  test("既存 components は Container の後ろに保持される", () => {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel("サポートサーバー").setURL("https://example.com").setStyle(ButtonStyle.Link),
    );
    const payload = v2({
      embeds: [{ title: "エラー" }],
      components: [row],
      flags: MessageFlags.Ephemeral,
    }) as Json;
    const components = payload.components as unknown[];
    expect(components).toHaveLength(2);
    expect(components[1]).toBe(row);
  });

  test("attachment:// で参照済みの files はギャラリーを重複追加しない", () => {
    const payload = v2({
      files: [new AttachmentBuilder(Buffer.from("x"), { name: "levelcard.png" })],
      embeds: [{ title: "レベル", image: { url: "attachment://levelcard.png" } }],
    }) as Json;
    const container = asJson((payload.components as unknown[])[0]);
    const galleries = (container.components as Json[]).filter((c) => c.type === 12);
    expect(galleries).toHaveLength(1);
    expect(payload.files).toBeDefined();
  });

  test("未参照の画像 files は MediaGallery として収まる", () => {
    const payload = v2({
      content: "[生成元](https://example.com)",
      files: [new AttachmentBuilder(Buffer.from("x")).setName("TakasumiBOT_MIQ.png")],
    }) as Json;
    const container = asJson((payload.components as unknown[])[0]);
    const gallery = (container.components as Json[]).find((c) => c.type === 12) as Json;
    expect(gallery).toBeDefined();
    expect(((gallery.items as Json[])[0].media as Json).url).toBe(
      "attachment://TakasumiBOT_MIQ.png",
    );
  });

  test("フラグなしでも V2 フラグが付く", () => {
    const payload = v2({ embeds: [{ description: "のみ" }] }) as Json;
    expect(Number(payload.flags)).toBe(MessageFlags.IsComponentsV2);
  });
});

describe("v2Json", () => {
  test("生 Webhook JSON 向けに components と flags へ変換される", () => {
    const payload = v2Json({
      username: "システム情報",
      avatar_url: "https://example.com/icon.png",
      embeds: [{ color: Colors.Green, title: "題", description: "文" }],
    }) as Json;
    expect(payload.username).toBe("システム情報");
    expect(payload.embeds).toBeUndefined();
    expect(payload.flags).toBe(MessageFlags.IsComponentsV2);
    const container = (payload.components as Json[])[0];
    expect(container.type).toBe(17);
    expect(texts(container)).toEqual(["## 題", "文"]);
  });
});

describe("extractV2Text", () => {
  test("旧 embed メッセージからは author/description を返す", () => {
    const result = extractV2Text({
      embeds: [{ author: { name: "user#0001" }, description: "本文です" }],
      components: [],
    });
    expect(result).toEqual({ author: "user#0001", description: "本文です" });
  });

  test("V2 メッセージからは先頭2つの TextDisplay を返す", () => {
    const container = embedToContainer({
      author: { name: "user#0001" },
      description: "本文です",
    });
    const result = extractV2Text({ embeds: [], components: [container] });
    expect(result).toEqual({ author: "user#0001", description: "本文です" });
  });
});
