import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  ChannelType,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";
import { prisma } from "@/Models/db";

class RegisterEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isModalSubmit() || interaction.customId != "register") return;

    const description = interaction.fields.getTextInputValue("description");

    try {
      if (!interaction.channel || !interaction.guild)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "登録できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "ギルド又はチャンネルを取得することができません",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if (
        interaction.channel.type !== ChannelType.GuildText &&
        interaction.channel.type !== ChannelType.GuildVoice &&
        interaction.channel.type !== ChannelType.GuildAnnouncement &&
        interaction.channel.type !== ChannelType.GuildStageVoice
      )
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "登録できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "テキストベースのチャンネルで実行してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      const invite = await interaction.channel.createInvite({
        unique: true,
        maxAge: 0,
      });

      await prisma.guildBoard.create({
        data: {
          guildId: interaction.guild.id,
          description: description,
          inviteUrl: invite.url,
        },
      });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "サーバー掲示板に登録しました",
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
              name: "登録できませんでした",
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
}

export default RegisterEvent;
