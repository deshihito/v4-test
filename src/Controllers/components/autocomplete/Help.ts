import { Client, InteractionResponse, AutocompleteInteraction } from "discord.js";
import { AutocompleteController } from "@/@types/Util";
import getParseCommands from "@/Controllers/parseCommand";

class HelpAutocompleteEvent implements AutocompleteController {
  public readonly client: Client;
  public readonly kind = "autocomplete" as const;
  public readonly commandName = "help";

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: AutocompleteInteraction): Promise<InteractionResponse<boolean> | void> {

    const focus = interaction.options.getFocused();

    const filter = getParseCommands().filter((command) =>
      command.name.toLocaleLowerCase().startsWith(focus.toLocaleLowerCase()),
    );

    if (filter.length > 25) filter.length = 25;

    await interaction.respond(
      filter.map((command) => ({
        name: `${command.name}: ${command.description}`,
        value: command.name,
      })),
    );
  }
}

export default HelpAutocompleteEvent;
