import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  MessageFlags,
  AttachmentBuilder,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";
import searchWhois from "@/Models/searchWhois";

class WhoisCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "search";
  public readonly name: string = "whois";
  public readonly description: string = "Whois検索をします";
  public readonly example: string[] = ["/whois google.com"];

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

    const domain = interaction.options.getString("domain", true);

    if (!domain.match(/^([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/))
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "取得できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "ドメインを指定してください",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });

    try {
      const refer = (await searchWhois("whois.iana.org", domain)).match(/refer:\s*(.*)/);
      if (!refer?.[1])
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "取得できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "有効なドメインを指定してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      const data = await searchWhois(refer[1], domain);

      await interaction.reply({
        files: [new AttachmentBuilder(Buffer.from(data)).setName(`WHOIS_${domain}.txt`)],
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
            description: "正しいドメインを指定してください",
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
        option.setName("domain").setDescription("検索するドメイン").setRequired(true),
      );
  }
}

export default WhoisCommand;
