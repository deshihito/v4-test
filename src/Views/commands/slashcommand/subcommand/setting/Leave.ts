import {
  Client,
  InteractionResponse,
  Colors,
  ChannelType,
  MessageFlags,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { SubCommand, ValidSubCommandInteraction } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";
import config from "@/config";
import {
  createLeaveNotice,
  deleteLeaveNotice,
  findLeaveNotice,
} from "@/Models/BoardNotice";
import deleteDuplicateWebhook from "@/Models/deleteDuplicateWebhook";
import deleteWebhook from "@/Models/deleteWebhook";

class LeaveSubCommand implements SubCommand {
  public readonly client: Client;

  public readonly name: string = "leave";
  public readonly description: string = "退出メッセージを設定します";
  public readonly example: string[] = ["/setting leave [User]が退出しました"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ManageWebhooks,
  ];

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: ValidSubCommandInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      interaction.options.getSubcommand() !== this.name ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const message: string | null = interaction.options.getString("message");

    const noticeData = await findLeaveNotice(interaction.guildId);

    if (noticeData) {
      const leaveNotice = await deleteLeaveNotice(interaction.guildId);

      void deleteWebhook(leaveNotice.webhookUrl);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "退出メッセージを無効にしました",
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } else {
      if (!message)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "退出メッセージを設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "メッセージを入力してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if (message.length > 100)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "退出メッセージを設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "メッセージは100文字以内にしてください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if (interaction.channel.type !== ChannelType.GuildText)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "退出メッセージを設定できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "メッセージを送信するチャンネルはテキストチャンネルにしてください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      await interaction.deferReply();
      await deleteDuplicateWebhook(interaction.channel, ["TakasumiBOT", "TakasumiBOT leaveNotice"]);

      try {
        const webhook = await interaction.channel.createWebhook({
          name: "TakasumiBOT leaveNotice",
          avatar: config.image.botIcon,
        });

        await createLeaveNotice(
          interaction.guildId,
          interaction.channelId,
          webhook.url,
          message,
        );

        await interaction.editReply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: "退出メッセージを設定しました",
                icon_url: config.image.successIcon,
              },
              description: `送信メッセージ: ${message}`,
            },
          ],
        });
      } catch (error) {
        await interaction.editReply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "退出メッセージを設定できませんでした",
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

  public build(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) => option.setName("message").setDescription("送信するメッセージ"));
  }
}

export default LeaveSubCommand;
