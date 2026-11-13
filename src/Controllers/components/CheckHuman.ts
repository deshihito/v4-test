import {
  Client,
  Colors,
  InteractionResponse,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { ModalController } from "@/@types/Util";
import config from "@/config";
import { deleteCheckHuman } from "@/Models/CheckHuman";
import { v2 } from "@/util/v2";

class CheckHumanEvent implements ModalController {
  public readonly client: Client;
  public readonly kind = "modal" as const;
  public readonly customId = "checkhuman_";
  public readonly prefix = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: ModalSubmitInteraction): Promise<InteractionResponse<boolean> | void> {

    const data = interaction.customId.split("_");
    const code = interaction.fields.getTextInputValue("code");

    if (isNaN(Number(code)))
      return await interaction.reply(v2({
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
      }));

    if (code !== data[1])
      return await interaction.reply(v2({
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
      }));

    await deleteCheckHuman(interaction.user.id);

    await interaction.reply(v2({
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
    }));
  }
}

export default CheckHumanEvent;
