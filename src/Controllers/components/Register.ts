import {
  Client,
  Colors,
  InteractionResponse,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  ChannelType,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import config from "@/config";
import { createGuildBoard } from "@/Models/GuildBoard";

class RegisterEvent implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "register";
  public readonly prefix = false;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ModalSubmitInteraction): Promise<InteractionResponse<boolean> | void> {

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

      await createGuildBoard(interaction.guild.id, description, invite.url);

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
