import { prisma } from "@/Models/db";

const calcNextTime = async (
  userId: string,
  commandName: string,
  count: number,
): Promise<number> => {
  const command = await prisma.commandCooldown.findFirst({
    where: {
      userId: userId,
      commandName: commandName,
    },
  });

  if (!command) return 0;

  return count * 1000 - (new Date().getTime() - command.executedAt.getTime());
};

export default calcNextTime;
