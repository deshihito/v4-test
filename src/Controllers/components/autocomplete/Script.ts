import { Client, InteractionResponse, AutocompleteInteraction } from "discord.js";
import { AutocompleteController } from "@/@types/Util";
import { ScriptResponse } from "@/@types/Api";

class ScriptAutocompleteEvent implements AutocompleteController {
  public readonly client: Client;
  public readonly kind = "autocomplete" as const;
  public readonly commandName = "script";

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: AutocompleteInteraction): Promise<InteractionResponse<boolean> | void> {

    const focus = interaction.options.getFocused();

    const langData: ScriptResponse[] = await fetch("https://wandbox.org/api/list.json").then(
      (res) => res.json(),
    );

    const filter = langData.filter(
      (lang) =>
        lang.name.toLocaleLowerCase().startsWith(focus.toLocaleLowerCase()) ||
        lang.language.toLocaleLowerCase().startsWith(focus.toLocaleLowerCase()),
    );

    if (filter.length > 25) filter.length = 25;

    await interaction.respond(
      filter.map((lang) => ({ name: `${lang.language}(${lang.name})`, value: lang.name })),
    );
  }
}

export default ScriptAutocompleteEvent;
