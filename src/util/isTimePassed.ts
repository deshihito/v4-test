import createId from "@/util/createId";
import { prisma } from "@/Models/db";

const isTimePassed = async (
  userId: string,
  commandName: string,
  count: number,
): Promise<boolean> => {
  const command = await prisma.commandCooldown.findFirst({
    where: {
      userId: userId,
      commandName: commandName,
    },
  });

  if (!command) {
    await prisma.commandCooldown.create({
      data: {
        id: createId(10),
        userId: userId,
        commandName: commandName,
      },
    });

    return true;
  }

  if ((new Date().getTime() - command.executedAt.getTime()) / 1000 >= count) {
    await prisma.commandCooldown.updateMany({
      where: {
        userId: userId,
        commandName: commandName,
      },
      data: {
        executedAt: new Date(),
      },
    });

    return true;
  } else {
    return false;
  }
};

export default isTimePassed;
