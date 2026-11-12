import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import { NslookupResponse } from "@/@types/Api";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class NslookupCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "tool";
  public readonly name: string = "nslookup";
  public readonly description: string = "DNS情報を取得します";
  public readonly example: string[] = ["/nslookup google.com"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const name = interaction.options.getString("name", true);

    try {
      const data: NslookupResponse = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(name)}`,
      ).then((res) => res.json());

      if (!data.Answer)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "取得できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "違うアドレスを試してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: `${name}の結果`,
              icon_url: config.image.successIcon,
            },
            description: `\`${data.Answer.map((address) => address.data).join("\n")}\``,
          },
        ],
      });
    } catch {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "違うアドレスを試してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option.setName("name").setDescription("取得するアドレス").setRequired(true),
      );
  }
}

export default NslookupCommand;
