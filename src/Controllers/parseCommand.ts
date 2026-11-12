import { CommandDisplayData } from "@/@types/Util";
import commands from "@/static/commands.json";

const getParseCommands = (): CommandDisplayData[] => {
  const commandList: CommandDisplayData[] = [];

  commands.forEach((command) => {
    if (command.subcommands.length === 0) {
      commandList.push({
        type: command.type,
        name: command.name,
        description: command.description,
        example: command.example,
        userPermission: command.userPermission,
        botPermission: command.botPermission,
        note: command.note,
      });
    } else {
      command.subcommands.forEach((subcommand) => {
        commandList.push({
          type: command.name,
          name: `${command.name} ${subcommand.name}`,
          description: subcommand.description,
          example: subcommand.example,
          userPermission: subcommand.userPermission,
          botPermission: subcommand.botPermission,
          note: subcommand.note,
        });
      });
    }
  });

  return commandList;
};

export default getParseCommands;
