import { Client, BaseInteraction, Colors, InteractionResponse, MessageFlags } from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import config from "@/config";
import { prisma } from "@/Models/db";

class CheckHumanEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isModalSubmit() || !interaction.customId.startsWith("checkhuman_")) return;

    const data = interaction.customId.split("_");
    const code = interaction.fields.getTextInputValue("code");

    if (isNaN(Number(code)))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "認証コードが間違っています",
              icon_url: config.image.errorIcon,
            },
            description: "答えの数字を半角で入力してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (code !== data[1])
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "入力コードが間違っています",
              icon_url: config.image.errorIcon,
            },
            description: "認証時に表示される画面に書かれている通りに認証してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    await prisma.checkHuman.delete({
      where: {
        userId: interaction.user.id,
      },
    });

    await interaction.reply({
      embeds: [
        {
          color: Colors.Green,
          author: {
            name: "人間であることを確認しました",
            icon_url: config.image.successIcon,
          },
          description: "引き続きサービスを利用することができます",
        },
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}

export default CheckHumanEvent;
