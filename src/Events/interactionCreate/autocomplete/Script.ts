import { Client, BaseInteraction, InteractionResponse } from "discord.js";
import { InteractionCreateEvent } from "@/@types/Util";
import { ScriptResponse } from "@/@types/Api";

class ScriptAutocompleteEvent implements InteractionCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(interaction: BaseInteraction): Promise<InteractionResponse<boolean> | void> {
    if (!interaction.isAutocomplete() || interaction.commandName !== "script") return;

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
