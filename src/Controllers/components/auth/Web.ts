import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  GuildMemberRoleManager,
  ButtonInteraction,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import Config from "@/config";
import crypto from "node:crypto";
import config from "@/config";
import { findRecentWebauthSession, createWebauth } from "@/Models/Webauth";

class WebAuthEvent implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "web_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ButtonInteraction): Promise<InteractionResponse<boolean> | void> {

    const data = interaction.customId.split("_");

    if (!interaction.member || !(interaction.member.roles instanceof GuildMemberRoleManager))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "ロールが取得できませんでした",
              icon_url: config.image.errorIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (interaction.member.roles.cache.has(data[1]))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "既に認証済みです",
              icon_url: config.image.errorIcon,
            },
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    const currentSession = await findRecentWebauthSession(
      interaction.user.id,
      new Date(Date.now() - 300000),
    );

    if (currentSession)
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "認証できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "他の認証待ちのセッションがあります\nしばらくしてから再度試してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sid = crypto.randomBytes(4).toString("hex");

    const authSession = await createWebauth({
      id: sid,
      userId: interaction.user.id,
      guildId: interaction.guildId as string,
      roleId: data[1],
      interactionWebhookId: `https://discord.com/api/webhooks/${interaction.applicationId}/${interaction.token}/messages/@original`,
    });

    await interaction.editReply({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: "Web認証",
            icon_url: config.image.successIcon,
          },
          description: "下記のURLをクリックして認証してください\n5分以内に認証を行う必要があります",
        },
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("認証する")
            .setStyle(ButtonStyle.Link)
            .setURL(`${Config.api.webauthUrl}/${authSession.id}`),
        ),
      ],
    });
  }
}

export default WebAuthEvent;
