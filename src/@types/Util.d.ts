import {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Guild,
  Client,
  GuildMember,
  TextBasedChannel,
  DMChannel,
  PartialGroupDMChannel,
  RepliableInteraction,
  SlashCommandOptionsOnlyBuilder,
  Invite,
  Message,
  PartialDMChannel,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
  SlashCommandSubcommandBuilder,
  ContextMenuCommandBuilder,
  PartialGuildMember,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  ModalSubmitInteraction,
  AutocompleteInteraction,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  UserSelectMenuInteraction,
} from "discord.js";

type ErrorLogData = {
  message: string;
  userId?: string;
  channelId: string;
  guildId: string;
};

type ValidCommandInteraction = (
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction
  | UserContextMenuCommandInteraction
) & {
  guildId: string;
  channelId: string;
  member: GuildMember;
  guild: Guild & {
    members: { me: GuildMember };
  };
  channel: Exclude<TextBasedChannel, DMChannel | PartialGroupDMChannel | PartialDMChannel>;
};

type ValidSubCommandInteraction = ChatInputCommandInteraction & {
  guildId: string;
  channelId: string;
  member: GuildMember;
  guild: Guild & {
    members: { me: GuildMember };
  };
  channel: Exclude<TextBasedChannel, DMChannel | PartialGroupDMChannel | PartialDMChannel>;
};

type CommandType =
  | "info"
  | "server"
  | "manage"
  | "tool"
  | "search"
  | "fun"
  | "account"
  | "stock"
  | "gift"
  | "money"
  | "bot"
  | "setting"
  | "othor"
  | "contextmenu";

interface Command {
  readonly client: Client;
  readonly type: CommandType;
  readonly name: string;
  readonly description: string;
  readonly note?: string;
  readonly example: string[];
  readonly userPermission: bigint[];
  readonly botPermission: bigint[];
  readonly isDisplay: boolean;
  subcommands?: SubCommand[];
  execute(interaction: RepliableInteraction): Promise<InteractionResponse<boolean> | void>;
  build():
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | ContextMenuCommandBuilder;
}

type CommandData = {
  readonly type: CommandType;
  readonly name: string;
  readonly description: string;
  readonly note?: string;
  readonly example?: string[];
  readonly userPermission: string[];
  readonly botPermission: string[];
};

interface ReadyEvent {
  readonly client: Client;
  execute(): Promise<void>;
}

interface MessageCreateEvent {
  readonly client: Client;
  execute(message: Message): Promise<Message | void>;
}

interface MessageUpdateEvent {
  readonly client: Client;
  execute(
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>,
    newMessage: OmitPartialGroupDMChannel<Message<boolean>>,
  ): Promise<void>;
}

interface InteractionCreateEvent {
  readonly client: Client;
  execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void>;
}

interface MessageReactionAddEvent {
  readonly client: Client;
  execute(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ): Promise<void>;
}

interface ButtonController {
  readonly client: Client;
  readonly kind: "button";
  readonly customId: string;
  readonly prefix: boolean;
  execute(interaction: ButtonInteraction): Promise<InteractionResponse<boolean> | void>;
}

interface SelectController {
  readonly client: Client;
  readonly kind: "select";
  readonly customId: string;
  readonly prefix: boolean;
  execute(interaction: StringSelectMenuInteraction): Promise<InteractionResponse<boolean> | void>;
}

interface ChannelSelectController {
  readonly client: Client;
  readonly kind: "channelSelect";
  readonly customId: string;
  readonly prefix: boolean;
  execute(interaction: ChannelSelectMenuInteraction): Promise<InteractionResponse<boolean> | void>;
}

interface ModalController {
  readonly client: Client;
  readonly kind: "modal";
  readonly customId: string;
  readonly prefix: boolean;
  execute(interaction: ModalSubmitInteraction): Promise<InteractionResponse<boolean> | void>;
}

interface UserSelectController {
  readonly client: Client;
  readonly kind: "userSelect";
  readonly customId: string;
  readonly prefix: boolean;
  execute(interaction: UserSelectMenuInteraction): Promise<InteractionResponse<boolean> | void>;
}

interface AutocompleteController {
  readonly client: Client;
  readonly kind: "autocomplete";
  readonly commandName: string;
  execute(interaction: AutocompleteInteraction): Promise<InteractionResponse<boolean> | void>;
}

type ComponentController =
  | ButtonController
  | SelectController
  | ChannelSelectController
  | ModalController
  | UserSelectController
  | AutocompleteController;

interface GuildCreateEvent {
  readonly client: Client;
  execute(guild: Guild): Promise<void>;
}

interface GuildDeleteEvent {
  readonly client: Client;
  execute(guild: Guild): Promise<void>;
}

interface GuildMemberAddEvent {
  readonly client: Client;
  execute(member: GuildMember): Promise<void>;
}

interface GuildMemberRemoveEvent {
  readonly client: Client;
  execute(member: GuildMember | PartialGuildMember): Promise<void>;
}

interface SubCommand {
  readonly client: Client;
  readonly name: string;
  readonly description: string;
  readonly example: string[];
  readonly note?: string;
  readonly userPermission: bigint[];
  readonly botPermission: bigint[];
  execute(interaction: ValidSubCommandInteraction): Promise<InteractionResponse<boolean> | void>;
  build(): SlashCommandSubcommandBuilder;
}

type ValidInvite = Invite & {
  uses: number;
  inviterId: string;
};

type ModerateType = "spam" | "mention" | "invite" | "link" | "capital" | "token";

type ApiPermissionType = "read" | "read_write" | "admin";

type Word = {
  index: number;
  en: string;
  ja: string[];
};

type StockData = {
  id: string;
  name: string;
  description: string;
  dividendAmount: number;
  dividendRate: number;
  price: number;
};

type CommandDisplayData = {
  type: string;
  name: string;
  description: string;
  example: string[];
  note: string;
  userPermission: string[];
  botPermission: string[];
};

type Job = {
  name: string;
  id: string;
  type: string;
  typeName: string;
  requiredCoin: number;
  cooldown: number;
  baseSalary: number;
  bonusRate: number;
  failureRate: number;
  unemploymentRate: number;
};

type RollItem = {
  name: string;
  id: string;
  description: string;
  probability: number;
  tradeRate: number;
  imageUrl: string;
};

type ShardStats = {
  shardId: number;
  status: string;
  ping: number;
  guildCount: number;
  userCount: number;
};

type SendGlobalChatOptions = {
  title: string;
  desc: string;
  footerText?: string;
  thumbnailUrl?: string;
  fromServerId?: string;
  fromUserId?: string;
  fromChannelId?: string;
  fromMessageId?: string;
  userName?: string;
};

export {
  ErrorLogData,
  ValidCommandInteraction,
  ValidInvite,
  CommandType,
  Command,
  SubCommand,
  ModerateType,
  ReadyEvent,
  MessageCreateEvent,
  ValidSubCommandInteraction,
  InteractionCreateEvent,
  MessageReactionAddEvent,
  ButtonController,
  SelectController,
  ChannelSelectController,
  ModalController,
  UserSelectController,
  AutocompleteController,
  ComponentController,
  CommandData,
  ApiPermissionType,
  Word,
  GuildCreateEvent,
  GuildDeleteEvent,
  GuildMemberAddEvent,
  GuildMemberRemoveEvent,
  CommandDisplayData,
  Job,
  StockData,
  MessageUpdateEvent,
  RollItem,
  ShardStats,
  SendGlobalChatOptions,
  PrismaTransaction,
};
