import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import CommandUtils from "@/Controllers/CommandUtils";

class AboutCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "bot";
  public readonly name: string = "about";
  public readonly description: string = "ABOUTを表示します";
  public readonly example: string[] = ["/about"];

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

    await interaction.reply({
      embeds: [
        {
          color: Colors.Green,
          title: "TakasumiBOTとは",
          description:
            "便利な多機能BOTを目指して開発されています\nサポートサーバーへの参加もよろしくお願いします\n開発:[@taka005](https://discord.com/users/790489873957781536)\n\n関連リンク\n[公式サイト](https://www.takasumibot.com/)",
        },
      ],
    });
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default AboutCommand;
