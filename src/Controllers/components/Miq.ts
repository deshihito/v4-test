import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonStyle,
  ButtonBuilder,
  ButtonInteraction,
} from "discord.js";
import { ButtonController } from "@/@types/Util";
import config from "@/config";
import Fetch from "@/Models/Fetch";
import { v2 } from "@/util/v2";

class MiqEvent implements ButtonController {
  public readonly client: Client;
  public readonly kind = "button" as const;
  public readonly customId = "miq_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ButtonInteraction): Promise<InteractionResponse<boolean> | void> {

    const data = interaction.customId.split("_");

    if (interaction.user.id !== data[2])
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "編集できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "作成者のみが操作可能です",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    if (!interaction.channel)
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "編集できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "存在しないチャンネルです",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    const message = await Fetch.message(interaction.channel, data[3]);
    if (!message)
      return await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "編集できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "BOTの権限が不足しているか引用元のメッセージが存在しません",
          },
        ],
        flags: MessageFlags.Ephemeral,
      }));

    const image = await fetch(
      `${config.api.miqUrl}/?type=${data[1]}&name=${message.author.username}&id=${message.author.id}&content=${message.cleanContent.replace("#", "＃")}&icon=${message.author.avatarURL({ extension: "png", size: 1024 }) || message.author.defaultAvatarURL}`,
    ).then((res) => res.arrayBuffer());

    try {
      const files = [new AttachmentBuilder(Buffer.from(image)).setName("TakasumiBOT_MIQ.png")];
      await interaction.message.edit(
        interaction.message.flags.has(MessageFlags.IsComponentsV2)
          ? {
              files: files,
              components: interaction.message.components,
              flags: MessageFlags.IsComponentsV2,
            }
          : v2({
              content: interaction.message.content,
              files: files,
              components: interaction.message.components,
            }),
      );

      await interaction.deferUpdate({});
    } catch (error) {
      await interaction.reply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "編集できませんでした",
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
      }));
    }
  }
}

export default MiqEvent;
