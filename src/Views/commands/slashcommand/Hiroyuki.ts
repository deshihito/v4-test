import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  PermissionFlagsBits,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import {
  findHiroyukiByGuildId,
  createHiroyuki,
  deleteManyHiroyukiByGuildId,
} from "@/Models/Hiroyuki";
import deleteWebhook from "@/Models/deleteWebhook";
import deleteDuplicateWebhook from "@/Models/deleteDuplicateWebhook";

class HiroyukiCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "fun";
  public readonly name: string = "hiroyuki";
  public readonly description: string = "ひろゆきを召喚します";
  public readonly example: string[] = ["/hiroyuki"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageChannels];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ManageWebhooks,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ManageMessages,
  ];

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

    const hiroyukiData = await findHiroyukiByGuildId(interaction.guild.id);

    if (hiroyukiData) {
      await deleteManyHiroyukiByGuildId(interaction.guild.id);

      void deleteWebhook(hiroyukiData.webhookUrl);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "ひろゆき退散",
              icon_url: config.image.successIcon,
            },
            description:
              "ご利用ありがとうございました\nこれからも、TakasumiBOTをよろしくお願いします",
          },
        ],
      });
    } else {
      if (
        !interaction.channel ||
        interaction.channel.isDMBased() ||
        interaction.channel.isThread()
      ) {
        let msgText = "";
        if (!interaction.channel) msgText = "チャンネル情報の取得ができませんでした";
        if (interaction.channel.isDMBased())
          msgText =
            "DMでひろゆきを召喚することはできません\nサーバーのテキストチャンネルで召喚してください";
        if (interaction.channel.isThread())
          msgText =
            "スレッドでひろゆきを召喚することはできません\n通常のテキストチャンネルで召喚してください";
        return await interaction.reply({
          embeds: [
            {
              author: {
                name: "ひろゆきの召喚に失敗しました",
                icon_url: config.image.errorIcon,
              },
              color: Colors.Red,
              description: msgText,
            },
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();
      await deleteDuplicateWebhook(interaction.channel, ["ひろゆき"]);

      try {
        const webhook = await interaction.channel.createWebhook({
          name: "ひろゆき",
          avatar: config.image.hiroyukiIcon,
        });

        await createHiroyuki({
          channelId: interaction.channelId,
          guildId: interaction.guildId,
          webhookUrl: webhook.url,
        });

        await interaction.editReply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "ひろゆきの召喚に成功しました",
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      } catch (error) {
        await interaction.editReply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "ひろゆきの召喚に失敗しました",
                icon_url: config.image.errorIcon,
              },
              description: "BOTの権限が不足しているか,\n既にwebhookの作成回数が上限に達しています",
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
        });
      }
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default HiroyukiCommand;
