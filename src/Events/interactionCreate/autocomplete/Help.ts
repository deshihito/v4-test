import { Client, BaseInteraction, InteractionResponse } from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import getParseCommands from "@/Controllers/parseCommand";

class HelpAutocompleteEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isAutocomplete() || interaction.commandName !== "help") return;

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
