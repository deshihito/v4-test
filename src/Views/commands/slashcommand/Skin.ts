import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  AttachmentBuilder,
  Message,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import { v2 } from "@/util/v2";

class SkinCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "skin";
  public readonly description: string = "マインクラフトのスキンを検索します";
  public readonly example: string[] = ["/skin User"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | Message | void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const name = interaction.options.getString("name");

    await interaction.deferReply();
    try {
      const image = await fetch(`https://minotar.net/armor/body/${name}/100.png`).then((res) =>
        res.arrayBuffer(),
      );

      const disposition = (await fetch(`https://minotar.net/download/${name}`)).headers.get(
        "Content-Disposition",
      );

      if (!disposition)
        throw await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "取得出来ませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "指定したユーザーは存在しません",
            },
          ],
        }));

      const match = disposition.match(/filename="([^"]+)"/);
      if (!match || !match[1])
        return await interaction.editReply(v2({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "取得出来ませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "指定したユーザーは存在しません",
            },
          ],
        }));

      const link = match[1].replace(/\.png$/, "");

      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${name}のスキン`,
              icon_url: config.image.successIcon,
            },
            image: {
              url: "attachment://skin.png",
            },
          },
        ],
        files: [new AttachmentBuilder(Buffer.from(image)).setName("skin.png")],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("スキンをダウンロード")
              .setURL(`https://textures.minecraft.net/texture/${link}`)
              .setStyle(ButtonStyle.Link),
          ),
        ],
      }));
    } catch {
      await interaction.editReply(v2({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得出来ませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "違うユーザー名で試してください",
          },
        ],
      }));
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("name").setDescription("ユーザー名").setRequired(true),
      );
  }
}

export default SkinCommand;
