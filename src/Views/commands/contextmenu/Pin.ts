import {
  Client,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  InteractionResponse,
  Colors,
  RepliableInteraction,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  PermissionFlagsBits,
  ButtonStyle,
  ChannelType,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { prisma } from "@/Models/db";
import deleteDuplicateWebhook from "@/Models/deleteDuplicateWebhook";
import deleteWebhook from "@/Models/deleteWebhook";

class PinContextMenu implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "contextmenu";
  public readonly name: string = "メッセージを固定";
  public readonly description: string = "メッセージを常に下に表示します";
  public readonly example: string[] = [];

  public readonly userPermission: bigint[] = [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageMessages,
  ];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageWebhooks,
  ];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      !interaction.isMessageContextMenuCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const message = interaction.options.getMessage("message");

    const pinChannelData = await prisma.pin.findUnique({
      where: {
        channelId: interaction.channel.id,
      },
    });

    if (!pinChannelData) {
      if (interaction.channel.type !== ChannelType.GuildText)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "メッセージをピン留めできませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "テキストチャンネルで実行してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if (!message?.content)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "メッセージをピン留めできませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "メッセージの内容が存在しません",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      const pinGuildCount = await prisma.pin.count({
        where: {
          guildId: interaction.guild.id,
        },
      });

      if (pinGuildCount >= 6)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "メッセージをピン留めできませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "サーバーには最大6個までしかメッセージを固定できません",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      try {
        await interaction.deferReply().then(() => interaction.deleteReply());
        await deleteDuplicateWebhook(interaction.channel, ["TakasumiBOT PIN"]);

        const webhook = await interaction.channel.createWebhook({
          name: "TakasumiBOT PIN",
          avatar: config.image.botIcon,
        });

        const msg = await webhook.send({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: message.author.tag,
                icon_url: message.author.avatarURL() || message.author.defaultAvatarURL,
              },
              description: message.content,
              footer: {
                text: "TakasumiBOT PIN",
              },
            },
          ],
        });

        await prisma.pin.create({
          data: {
            channelId: interaction.channelId,
            messegeId: msg.id,
            guildId: interaction.guildId,
            webhookUrl: webhook.url,
          },
        });
      } catch (error) {
        await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "メッセージをピン留めできませんでした",
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
    } else {
      const pin = await prisma.pin.delete({
        where: {
          channelId: interaction.channel.id,
        },
      });

      void deleteWebhook(pin.webhookUrl);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "メッセージのピン留めが解除されました",
              icon_url: config.image.successIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  public build(): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder()
      .setName(this.name)
      .setType(ApplicationCommandType.Message);
  }
}

export default PinContextMenu;
