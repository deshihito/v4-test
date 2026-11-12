import {
  Client,
  BaseInteraction,
  Colors,
  InteractionResponse,
  MessageFlags,
  ActionRowBuilder,
  AttachmentBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import Random from "@/util/Random";

class ImageAuthEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isButton() || !interaction.customId.startsWith("image_")) return;

    const data = interaction.customId.split("_");

    const keys = [
      { text: "2daAfg", url: "https://cdn.takasumibot.com/images/auth/img_1.png" },
      { text: "wad3EF", url: "https://cdn.takasumibot.com/images/auth/img_2.png" },
      { text: "G4sveS", url: "https://cdn.takasumibot.com/images/auth/img_3.png" },
      { text: "3dgHR", url: "https://cdn.takasumibot.com/images/auth/img_4.png" },
      { text: "ascA23", url: "https://cdn.takasumibot.com/images/auth/img_5.png" },
      { text: "Cd2d4s", url: "https://cdn.takasumibot.com/images/auth/img_6.png" },
      { text: "Mgfn4", url: "https://cdn.takasumibot.com/images/auth/img_7.png" },
      { text: "Hsdgs1", url: "https://cdn.takasumibot.com/images/auth/img_8.png" },
    ];

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const key = Random.getRandomElement(keys);

    const image = await fetch(key.url).then((res) => res.arrayBuffer());

    await interaction.editReply({
      embeds: [
        {
          color: Colors.Green,
          title: "画像認証",
          description:
            "画像にある文字を選択してください\n※画像が表示されるまで時間がかかる場合があります",
          image: {
            url: "attachment://code.png",
          },
        },
      ],
      files: [new AttachmentBuilder(Buffer.from(image)).setName("code.png")],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`imagerole_${data[1]}_${key.text}`)
            .setPlaceholder("正しいものを選択")
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
              keys.map((key) => ({
                label: key.text,
                value: key.text,
              })),
            ),
        ),
      ],
    });
  }
}

export default ImageAuthEvent;
