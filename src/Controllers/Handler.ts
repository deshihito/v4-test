import {
  Client,
  Message,
  Events,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionCallbackResponse,
  InteractionResponse,
  BaseInteraction,
  Routes,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  Guild,
  RepliableInteraction,
  PartialGuildMember,
  OmitPartialGroupDMChannel,
  PartialMessage,
  GuildMember,
  PrimaryEntryPointCommandInteraction,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  PermissionFlagsBits,
} from "discord.js";
import { createCommandHistory } from "@/Models/CommandHistory";
import {
  RESTRICTED_MESSAGE,
  SELF_COMMAND,
  checkCommandControl,
  formatRetryAfter,
  getCommandControl,
} from "@/Models/BotFixer";
import { findDisableCommandStateByName } from "@/Models/DisableCommand";
import { disableCommand } from "@/generated";
import EventLoader from "@/Events/EventLoader";
import fs from "fs";
import path from "path";
import config from "@/config";
import Mute from "@/Models/Mute";
import Log from "@/util/Log";
import { Command, CommandData, ComponentController } from "@/@types/Util";
import { pathToFileURL } from "url";
import Permission from "@/util/Permission";
import DBCache from "@/Models/DBCache";
import isAdmin from "@/Models/isAdmin";
import { env } from "@/util/Env";
import { v2 } from "@/util/v2";

class Handler {
  public readonly client: Client;
  private commands: Command[] = [];
  private loader: EventLoader;

  constructor(client: Client) {
    this.client = client;
    this.loader = new EventLoader(this.client);

    this.client.once(Events.ClientReady, this.onReady.bind(this));
    this.client.on(Events.MessageCreate, this.onMessageCreate.bind(this));
    this.client.on(Events.MessageUpdate, this.onMessageUpdate.bind(this));
    this.client.on(Events.MessageReactionAdd, this.onMessageReactionAdd.bind(this));
    this.client.on(Events.InteractionCreate, this.onInteractionCreate.bind(this));
    this.client.on(Events.GuildCreate, this.onGuildCreate.bind(this));
    this.client.on(Events.GuildDelete, this.onGuildDelete.bind(this));
    this.client.on(Events.GuildMemberAdd, this.onGuildMemberAdd.bind(this));
    this.client.on(Events.GuildMemberRemove, this.onGuildMemberRemove.bind(this));

    this.client.on(Events.Debug, (message) => {
      Log.debug(message);
    });

    this.client.on(Events.Warn, (message) => {
      Log.warn(message);
    });
  }

  private async onReady(): Promise<void> {
    Log.debug("ファイルをロード中...");

    await this.loadCommand();
    await this.loader.load();
    await this.addCommand();

    if (!this.client.shard || env.SHARDS === "0") {
      this.saveCommandData();
    }

    Promise.all(this.loader.readyEvents.map((event) => event.execute()));
  }

  private async onMessageCreate(message: Message): Promise<void> {
    if (!message.inGuild()) return;

    if (
      !message.guild.members.me ||
      !message.channel.viewable ||
      (await Mute.isMuteGuild(message.guild.id)) ||
      (await Mute.isMuteUser(message.author.id))
    )
      return;

    Promise.all(this.loader.messageCreateEvent.map((event) => event.execute(message)));
  }

  private async onMessageUpdate(
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>,
    newMessage: OmitPartialGroupDMChannel<Message<boolean>>,
  ): Promise<void> {
    Promise.all(
      this.loader.messageUpdateEvent.map((event) => event.execute(oldMessage, newMessage)),
    );
  }

  private async onMessageReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ): Promise<void> {
    Promise.all(
      this.loader.messageReactionAddEvent.map((event) => event.execute(reaction, user)),
    );
  }

  private async onInteractionCreate(
    interaction: BaseInteraction,
  ): Promise<
    InteractionCallbackResponse | Message<boolean> | InteractionResponse<boolean> | undefined
  > {
    if (interaction.isRepliable()) {
      if (!interaction.guild)
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "コマンドが実行できません",
                icon_url: config.image.errorIcon,
              },
              description: "BOTの操作はサーバー以外で実行することができません",
            },
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("サポートサーバー")
                .setURL(config.inviteUrl)
                .setStyle(ButtonStyle.Link),
            ),
          ],
        }));

      if (await Mute.isMuteGuild(interaction.guild.id))
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "コマンドが実行できません",
                icon_url: config.image.errorIcon,
              },
              description: "このサーバーはブラックリストに登録されているため実行できません",
            },
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("サポートサーバー")
                .setURL(config.inviteUrl)
                .setStyle(ButtonStyle.Link),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        }));

      if (await Mute.isMuteUser(interaction.user.id))
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "コマンドが実行できません",
                icon_url: config.image.errorIcon,
              },
              description: "あなたはブラックリストに登録されているため実行できません",
            },
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("サポートサーバー")
                .setURL(config.inviteUrl)
                .setStyle(ButtonStyle.Link),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        }));

      if (
        "commandName" in interaction &&
        (await this.isDisableCommand(interaction)) &&
        !(await isAdmin(interaction.user.id))
      )
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "コマンドが実行できません",
                icon_url: config.image.errorIcon,
              },
              description: "このコマンドは**システム管理者**によって無効にされています",
            },
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("サポートサーバー")
                .setURL(config.inviteUrl)
                .setStyle(ButtonStyle.Link),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        }));

      const restrictedDescription = await this.commandRestriction(interaction);
      if (restrictedDescription)
        return await interaction.reply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "コマンドが実行できません",
                icon_url: config.image.errorIcon,
              },
              description: restrictedDescription,
            },
          ],
          flags: MessageFlags.Ephemeral,
        }));

      Promise.all(this.commands.map((command) => command.execute(interaction)));

      this.addHisotry(interaction);
    }

    this.dispatchComponent(interaction);

    DBCache.addUser(interaction.user);

    if (interaction.guild) {
      DBCache.addGuild(interaction.guild);
    }
  }

  // コンポーネント (ボタン/セレクト/モーダル) と補完は、種別と customId が
  // 一致するコントローラーにだけ振り分ける (旧来の全件実行+自己選別を置換)
  private dispatchComponent(interaction: BaseInteraction): void {
    for (const controller of this.loader.componentControllers) {
      if (
        controller.kind === "button" &&
        interaction.isButton() &&
        this.matchCustomId(controller, interaction.customId)
      ) {
        void controller.execute(interaction);
      } else if (
        controller.kind === "select" &&
        interaction.isStringSelectMenu() &&
        this.matchCustomId(controller, interaction.customId)
      ) {
        void controller.execute(interaction);
      } else if (
        controller.kind === "channelSelect" &&
        interaction.isChannelSelectMenu() &&
        this.matchCustomId(controller, interaction.customId)
      ) {
        void controller.execute(interaction);
      } else if (
        controller.kind === "userSelect" &&
        interaction.isUserSelectMenu() &&
        this.matchCustomId(controller, interaction.customId)
      ) {
        void controller.execute(interaction);
      } else if (
        controller.kind === "modal" &&
        interaction.isModalSubmit() &&
        this.matchCustomId(controller, interaction.customId)
      ) {
        void controller.execute(interaction);
      } else if (
        controller.kind === "autocomplete" &&
        interaction.isAutocomplete() &&
        interaction.commandName === controller.commandName
      ) {
        void controller.execute(interaction);
      }
    }
  }

  private matchCustomId(
    controller: Extract<ComponentController, { customId: string }>,
    customId: string,
  ): boolean {
    return controller.prefix
      ? customId.startsWith(controller.customId)
      : customId === controller.customId;
  }

  private async onGuildCreate(guild: Guild): Promise<void> {
    Promise.all(this.loader.guildCreateEvent.map((event) => event.execute(guild)));
  }

  private async onGuildDelete(guild: Guild): Promise<void> {
    Promise.all(this.loader.guildDeleteEvent.map((event) => event.execute(guild)));
  }

  private async onGuildMemberAdd(member: GuildMember): Promise<void> {
    Promise.all(this.loader.guildMemberAddEvent.map((event) => event.execute(member)));
  }

  private async onGuildMemberRemove(member: GuildMember | PartialGuildMember): Promise<void> {
    Promise.all(this.loader.guildMemberRemoveEvent.map((event) => event.execute(member)));
  }

  private async addHisotry(interaction: RepliableInteraction): Promise<void> {
    if (!interaction.isChatInputCommand() || !interaction.guildId) return;

    const name: string = `${interaction.commandName}${interaction.options.getSubcommand(false) ? ` ${interaction.options.getSubcommand(false)}` : ""}`;
    const options = interaction.options.getSubcommand(false)
      ? interaction.options.data[0].options
      : interaction.options.data;

    await createCommandHistory({
      userId: interaction.user.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      name: name,
      option: options
        ? options
            .filter((data) => data.value)
            .map((data) => `${data.name}:${data.value}`)
            .join(" ")
        : "",
    });
  }

  private async commandRestriction(interaction: BaseInteraction): Promise<string | null> {
    if (!interaction.isChatInputCommand() || !interaction.guildId) return null;
    if (interaction.commandName === SELF_COMMAND) return null;

    const permissions = interaction.memberPermissions;
    if (
      permissions?.has(PermissionFlagsBits.Administrator) ||
      permissions?.has(PermissionFlagsBits.ManageGuild)
    )
      return null;

    try {
      const data = await getCommandControl(interaction.guildId);
      if (data.mode === "off" && Object.keys(data.rates).length === 0) return null;
      const verdict = checkCommandControl(
        data,
        interaction.commandName,
        interaction.guildId,
        interaction.user.id,
      );
      if (verdict.allowed) return null;
      if (verdict.reason === "rate" && verdict.retryAfter !== undefined) {
        return `${RESTRICTED_MESSAGE}（目安: ${formatRetryAfter(verdict.retryAfter)}後に再試行できます）`;
      }
      return RESTRICTED_MESSAGE;
    } catch {
      return null;
    }
  }

  private async isDisableCommand(
    interaction:
      | ChatInputCommandInteraction
      | MessageContextMenuCommandInteraction
      | UserContextMenuCommandInteraction
      | PrimaryEntryPointCommandInteraction,
  ): Promise<boolean> {
    const state: disableCommand | null = await findDisableCommandStateByName(
      interaction.commandName,
    );

    return state !== null;
  }

  private async addCommand(): Promise<void> {
    if (!this.client.isReady()) return;

    const global = this.commands
      .filter((c) => c.name !== "admin")
      .map((command) => command.build());
    const admin = this.commands.filter((c) => c.name === "admin").map((command) => command.build());
    const adminGuilds = ["987698915820335124", "1103702475426513066"];

    await this.client.rest.put(Routes.applicationCommands(this.client.application.id), {
      body: global,
    });

    for (const guildId of adminGuilds) {
      try {
        await this.client.rest.put(
          Routes.applicationGuildCommands(this.client.application.id, guildId),
          {
            body: admin,
          },
        );
      } catch (err: any) {
        if (err.message != "Missing Access") {
          console.error(err);
        }
      }
    }
  }

  private async loadCommand(): Promise<void> {
    for (const filePath of await this.getCommandFiles("./src/Views/commands")) {
      const moduleURL = pathToFileURL(filePath).href;
      const module = (await import(moduleURL)) as { default: new (client: Client) => Command };
      this.commands.push(new module.default(this.client));
    }

    Log.debug("全てのコマンドをロードしました");
  }

  private async getCommandFiles(dir: string, fileList: string[] = []): Promise<string[]> {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    await Promise.all(
      files.map((file) => {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory() && !filePath.includes("subcommand")) {
          this.getCommandFiles(filePath, fileList);
        } else if (filePath.endsWith(".ts")) {
          fileList.push(filePath);
        }
      }),
    );

    return fileList;
  }

  private parseCommandData(): CommandData[] {
    return this.commands
      .sort((com1, com2) => com1.name.localeCompare(com2.name))
      .filter((command) => command.isDisplay)
      .map((command) => ({
        type: command.type,
        name: command.name,
        description: command.description,
        example: command.example,
        userPermission:
          command.userPermission.length !== 0
            ? command.userPermission.map((per) => Permission.IntToName(per))
            : ["必要なし"],
        botPermission:
          command.botPermission.length !== 0
            ? command.botPermission.map((per) => Permission.IntToName(per))
            : ["必要なし"],
        note: command.note || "なし",
        subcommands: command.subcommands
          ? command.subcommands.map((subcommand) => ({
              name: subcommand.name,
              description: subcommand.description,
              example: subcommand.example,
              note: subcommand.note || "なし",
              userPermission:
                subcommand.userPermission.concat(command.userPermission).length !== 0
                  ? subcommand.userPermission
                      .concat(command.userPermission)
                      .map((per) => Permission.IntToName(per))
                  : ["必要なし"],
              botPermission:
                subcommand.botPermission.concat(command.botPermission).length !== 0
                  ? subcommand.botPermission
                      .concat(command.botPermission)
                      .map((per) => Permission.IntToName(per))
                  : ["必要なし"],
            }))
          : [],
      }));
  }

  private saveCommandData(): void {
    fs.writeFileSync(
      "./src/static/commands.json",
      JSON.stringify(this.parseCommandData(), null, "  "),
      "utf-8",
    );

    Log.debug("コマンドデータを保存しました");
  }
}

export default Handler;
