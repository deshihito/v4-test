import {
  APIEmbed,
  ContainerBuilder,
  FileBuilder,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageCreateOptions,
  MessageEditOptions,
  MessageFlags,
  InteractionUpdateOptions,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  WebhookMessageCreateOptions,
} from "discord.js";

export type V2Payload = InteractionReplyOptions &
  InteractionEditReplyOptions &
  MessageCreateOptions &
  MessageEditOptions &
  InteractionUpdateOptions &
  WebhookMessageCreateOptions;

type EmbedInput =
  | APIEmbed
  | { toJSON: () => APIEmbed }
  | Record<string, unknown>;

const TEXT_LIMIT = 4000;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)$/i;

function normalizeEmbed(embed: EmbedInput): APIEmbed {
  if (embed && typeof (embed as { toJSON?: unknown }).toJSON === "function") {
    return (embed as { toJSON: () => APIEmbed }).toJSON();
  }
  return embed as APIEmbed;
}

function splitText(text: string): string[] {
  if (text.length <= TEXT_LIMIT) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > TEXT_LIMIT) {
    const cut = rest.lastIndexOf("\n", TEXT_LIMIT);
    const index = cut > 0 ? cut : TEXT_LIMIT;
    chunks.push(rest.slice(0, index));
    rest = rest.slice(index).replace(/^\n/, "");
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function timestampText(timestamp: APIEmbed["timestamp"]): string | null {
  if (!timestamp) return null;
  const ms = new Date(timestamp).getTime();
  if (Number.isNaN(ms)) return null;
  return `<t:${Math.floor(ms / 1000)}:f>`;
}

export function embedToContainer(
  embedInput: EmbedInput,
  leadingText?: string,
): ContainerBuilder {
  const embed = normalizeEmbed(embedInput);
  const parts: string[] = [];

  if (leadingText) parts.push(leadingText);
  if (embed.author?.name) {
    parts.push(
      embed.author.url ? `[${embed.author.name}](${embed.author.url})` : embed.author.name,
    );
  }
  if (embed.title) {
    parts.push(embed.url ? `## [${embed.title}](${embed.url})` : `## ${embed.title}`);
  }
  if (embed.description) parts.push(embed.description);
  for (const field of embed.fields ?? []) {
    if (!field) continue;
    const name = typeof field.name === "string" ? field.name : "";
    const value = typeof field.value === "string" ? field.value : "";
    if (!name && !value) continue;
    if (!name.trim() || name === "\u200b") parts.push(value);
    else parts.push(`**${name}**\n${value}`);
  }
  const footerParts = [embed.footer?.text, timestampText(embed.timestamp)].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );
  if (footerParts.length > 0) parts.push(`-# ${footerParts.join(" | ")}`);

  const displays = parts
    .filter((part) => part.length > 0)
    .flatMap((part) => splitText(part))
    .map((content) => new TextDisplayBuilder().setContent(content));

  const container = new ContainerBuilder();
  if (typeof embed.color === "number") container.setAccentColor(embed.color);

  const thumbnailUrl = embed.thumbnail?.url;
  if (thumbnailUrl) {
    const sectionDisplays =
      displays.length > 0 ? displays.slice(0, 3) : [new TextDisplayBuilder().setContent("\u200b")];
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(sectionDisplays)
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl)),
    );
    const rest = displays.slice(sectionDisplays.length);
    if (rest.length > 0) container.addTextDisplayComponents(rest);
  } else if (displays.length > 0) {
    container.addTextDisplayComponents(displays);
  }

  const imageUrl = embed.image?.url;
  if (imageUrl) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imageUrl)),
    );
  }

  if (!thumbnailUrl && !imageUrl && displays.length === 0) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent("\u200b"));
  }

  return container;
}

export function embedsToContainers(
  embeds: EmbedInput[],
  leadingText?: string,
): ContainerBuilder[] {
  const list = Array.isArray(embeds) ? embeds : [embeds];
  if (list.length === 0) {
    return leadingText
      ? [embedToContainer({}, leadingText)]
      : [];
  }
  return list.map((embed, index) =>
    embedToContainer(embed, index === 0 ? leadingText : undefined),
  );
}

function flagBitfield(flags: unknown): number {
  if (typeof flags === "number") return flags;
  if (typeof flags === "bigint") return Number(flags);
  if (flags && typeof flags === "object" && "bitfield" in flags) {
    return Number((flags as { bitfield: number | bigint }).bitfield);
  }
  return 0;
}

function attachmentName(file: unknown): string | null {
  if (typeof file === "string") return file.split("/").pop() ?? null;
  if (!file || typeof file !== "object") return null;
  const record = file as Record<string, unknown>;
  if (typeof record.name === "string" && record.name) return record.name;
  const data = record.data as Record<string, unknown> | undefined;
  if (data && typeof data.name === "string" && data.name) return data.name;
  if (typeof record.attachment === "string") return record.attachment.split("/").pop() ?? null;
  return null;
}

export function v2<T extends Record<string, unknown>>(options: T): V2Payload {
  const { content, embeds, components, flags, files, ...rest } = options as Record<
    string,
    unknown
  >;

  const embedList = (
    embeds == null ? [] : Array.isArray(embeds) ? embeds : [embeds]
  ) as EmbedInput[];
  const leadingText = typeof content === "string" && content.length > 0 ? content : undefined;
  const containers = embedsToContainers(embedList, leadingText);

  const fileList: unknown[] =
    files == null ? [] : Array.isArray(files) ? [...files] : [files];
  if (fileList.length > 0) {
    const referenced = new Set<string>();
    for (const container of containers) {
      const json = JSON.stringify(container.toJSON());
      for (const match of json.matchAll(/attachment:\/\/([^\s"']+)/g)) {
        referenced.add(match[1]);
      }
    }
    const galleryItems: MediaGalleryItemBuilder[] = [];
    const fileComponents: FileBuilder[] = [];
    for (const file of fileList) {
      const name = attachmentName(file);
      if (!name || referenced.has(name)) continue;
      if (IMAGE_EXTENSIONS.test(name)) {
        galleryItems.push(new MediaGalleryItemBuilder().setURL(`attachment://${name}`));
      } else {
        fileComponents.push(new FileBuilder().setURL(`attachment://${name}`));
      }
    }
    if (galleryItems.length > 0 || fileComponents.length > 0) {
      const target =
        containers.length > 0 ? containers[containers.length - 1] : new ContainerBuilder();
      if (containers.length === 0) containers.push(target);
      if (galleryItems.length > 0) {
        target.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(galleryItems));
      }
      if (fileComponents.length > 0) target.addFileComponents(fileComponents);
    }
  }

  const existing: unknown[] =
    components == null ? [] : Array.isArray(components) ? [...components] : [components];

  return {
    ...rest,
    ...(files !== undefined ? { files } : {}),
    components: [...containers, ...existing],
    flags: flagBitfield(flags) | MessageFlags.IsComponentsV2,
  } as unknown as V2Payload;
}

export function v2Json<T extends Record<string, unknown>>(options: T): Record<string, unknown> {
  const converted = v2(options) as unknown as Record<string, unknown>;
  const components = (converted.components as unknown[]).map((component) =>
    component && typeof (component as { toJSON?: unknown }).toJSON === "function"
      ? (component as { toJSON: () => unknown }).toJSON()
      : component,
  );
  return { ...converted, components };
}

export function extractV2Text(message: {
  embeds?: { author?: { name?: string } | null; description?: string | null }[];
  components?: unknown[];
}): { author?: string; description?: string } {
  const embed = message.embeds?.[0];
  if (embed && (embed.author?.name || embed.description)) {
    return {
      author: embed.author?.name ?? undefined,
      description: embed.description ?? undefined,
    };
  }
  const texts: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const json =
      typeof (node as { toJSON?: unknown }).toJSON === "function"
        ? (node as { toJSON: () => unknown }).toJSON()
        : node;
    if (!json || typeof json !== "object") return;
    const record = json as Record<string, unknown>;
    if (record.type === 10 && typeof record.content === "string") {
      texts.push(record.content);
    }
    if (Array.isArray(record.components)) {
      for (const child of record.components) walk(child);
    }
  };
  for (const component of message.components ?? []) walk(component);
  return { author: texts[0], description: texts[1] };
}

export default v2;
