import { Client } from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import Log from "@/util/Log";
import {
  ComponentController,
  MessageCreateEvent,
  MessageReactionAddEvent,
  ReadyEvent,
  GuildCreateEvent,
  GuildDeleteEvent,
  GuildMemberRemoveEvent,
  GuildMemberAddEvent,
  MessageUpdateEvent,
} from "@/@types/Util";

class EventLoader {
  public readonly client: Client;
  public readonly readyEvents: ReadyEvent[] = [];
  public readonly messageCreateEvent: MessageCreateEvent[] = [];
  public readonly messageUpdateEvent: MessageUpdateEvent[] = [];
  public readonly messageReactionAddEvent: MessageReactionAddEvent[] = [];
  public readonly componentControllers: ComponentController[] = [];
  public readonly guildCreateEvent: GuildCreateEvent[] = [];
  public readonly guildDeleteEvent: GuildDeleteEvent[] = [];
  public readonly guildMemberAddEvent: GuildMemberAddEvent[] = [];
  public readonly guildMemberRemoveEvent: GuildMemberRemoveEvent[] = [];

  constructor(client: Client) {
    this.client = client;
  }

  public async load(): Promise<void> {
    await this.loadReadyEvent();
    await this.loadMessageCreateEvent();
    await this.loadMessageUpdateEvent();
    await this.loadMessageReactionAddEvent();
    await this.loadComponentControllers();
    await this.loadGuildCreateEvent();
    await this.loadGuildDeleteEvent();
    await this.loadGuildMemberAddEvent();
    await this.loadGuildMemberRemoveEvent();
  }

  private async loadReadyEvent(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Events/ready")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as { default: new (client: Client) => ReadyEvent };
      this.readyEvents.push(new module.default(this.client));
    }

    Log.debug("Readyイベントをロードしました");
  }

  private async loadMessageCreateEvent(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Events/messageCreate")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as {
        default: new (client: Client) => MessageCreateEvent;
      };
      this.messageCreateEvent.push(new module.default(this.client));
    }

    Log.debug("MessageCreateイベントをロードしました");
  }

  private async loadMessageUpdateEvent(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Events/messageUpdate")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as {
        default: new (client: Client) => MessageUpdateEvent;
      };
      this.messageUpdateEvent.push(new module.default(this.client));
    }

    Log.debug("MessageUpdateイベントをロードしました");
  }

  private async loadMessageReactionAddEvent(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Events/messageReactionAdd")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as {
        default: new (client: Client) => MessageReactionAddEvent;
      };
      this.messageReactionAddEvent.push(new module.default(this.client));
    }

    Log.debug("MessageReactionAddイベントをロードしました");
  }

  private async loadComponentControllers(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Controllers/components")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as {
        default: new (client: Client) => ComponentController;
      };
      const controller = new module.default(this.client);
      // kind を持たないファイル (共有ベースクラス等) はコントローラーとして登録しない
      if ("kind" in controller) {
        this.componentControllers.push(controller);
      }
    }

    Log.debug("コンポーネントコントローラーをロードしました");
  }

  private async loadGuildCreateEvent(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Events/guildCreate")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as {
        default: new (client: Client) => GuildCreateEvent;
      };
      this.guildCreateEvent.push(new module.default(this.client));
    }

    Log.debug("GuildCreateイベントをロードしました");
  }

  private async loadGuildDeleteEvent(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Events/guildDelete")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as {
        default: new (client: Client) => GuildDeleteEvent;
      };
      this.guildDeleteEvent.push(new module.default(this.client));
    }

    Log.debug("GuildDeleteイベントをロードしました");
  }

  private async loadGuildMemberAddEvent(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Events/guildMemberAdd")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as {
        default: new (client: Client) => GuildMemberAddEvent;
      };
      this.guildMemberAddEvent.push(new module.default(this.client));
    }

    Log.debug("GuildMemberAddイベントをロードしました");
  }

  private async loadGuildMemberRemoveEvent(): Promise<void> {
    for (const filePath of await this.getFiles("./src/Events/guildMemberRemove")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as {
        default: new (client: Client) => GuildMemberRemoveEvent;
      };
      this.guildMemberRemoveEvent.push(new module.default(this.client));
    }

    Log.debug("GuildMemberRemoveイベントをロードしました");
  }

  private async getFiles(dir: string, fileList: string[] = []): Promise<string[]> {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    await Promise.all(
      files.map((file) => {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
          this.getFiles(filePath, fileList);
        } else if (filePath.endsWith(".ts")) {
          fileList.push(filePath);
        }
      }),
    );

    return fileList;
  }
}

export default EventLoader;
