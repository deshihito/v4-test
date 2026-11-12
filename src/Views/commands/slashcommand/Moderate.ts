import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ButtonStyle,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { Command, CommandType, ModerateType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class ModerateCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "moderate";
  public readonly description: string = "AutoModを使用したモデレート機能を設定します";
  public readonly example: string[] = ["/moderate スパムのブロック"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageGuild];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.ManageGuild];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const type = interaction.options.getString("type", true) as ModerateType;

    const options = {
      spam: {
        name: "TakasumiBOT スパムをブロック",
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Spam,
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
          },
        ],
        enabled: true,
      },
      mention: {
        name: "TakasumiBOT メンションスパムをブロック",
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.MentionSpam,
        triggerMetadata: {
          mentionTotalLimit: 5,
          mentionRaidProtectionEnabled: true,
        },
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
          },
        ],
        enabled: true,
      },
      invite: {
        name: "TakasumiBOT 招待リンクをブロック",
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
          regexPatterns: [
            "(https?://)?(?:www.)?(?:discord.(?:gg|com/invite|me|io)|discordapp.com/invite)/[a-zA-Z0-9]",
          ],
        },
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
          },
        ],
        enabled: true,
      },
      link: {
        name: "TakasumiBOT リンクをブロック",
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
          regexPatterns: ["https?://", "www."],
          allowList: [
            "*.gif",
            "*.jpg",
            "*.jpge",
            "*.png",
            "*.webp",
            "http://tenor.com/*",
            "https://tenor.com/*",
          ],
        },
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
          },
        ],
        enabled: true,
      },
      capital: {
        name: "TakasumiBOT 大文字スパムをブロック",
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
          regexPatterns: ["(?-i)^[A-Z\\s]+$"],
        },
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
          },
        ],
        enabled: true,
      },
      token: {
        name: "TakasumiBOT トークンをブロック",
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
          regexPatterns: [
            "\\b[0-9a-zA-Z]{24}.[0-9a-zA-Z]{6}.[0-9a-zA-Z_-]{38}\\b",
            "\\b[0-9a-zA-Z]{24}.[0-9a-zA-Z]{6}.[0-9a-zA-Z_-]{27}\\b",
          ],
        },
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
          },
        ],
        enabled: true,
      },
    };

    const name = {
      spam: "スパムのブロック",
      mention: "メンションスパムのブロック",
      invite: "招待リンクのブロック",
      link: "URLのブロック",
      capital: "大文字スパムのブロック",
      token: "トークンをブロック",
    };

    try {
      await interaction.guild.autoModerationRules.create(options[type]);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${name[type]}を設定しました`,
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: `${name[type]}を設定できませんでした  `,
              icon_url: config.image.errorIcon,
            },
            fields: [
              {
                name: "エラーコード",
                value: `\`\`\`${error}\`\`\``,
              },
            ],
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
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("設定する機能")
          .setRequired(true)
          .addChoices(
            { name: "スパムのブロック", value: "spam" },
            { name: "メンションスパムのブロック", value: "mention" },
            { name: "招待リンクのブロック", value: "invite" },
            { name: "リンクのブロック", value: "link" },
            { name: "大文字スパムのブロック", value: "capital" },
            { name: "トークンのブロック", value: "token" },
          ),
      );
  }
}

export default ModerateCommand;
