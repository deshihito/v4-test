import { prisma } from "@/Models/db";

export async function findDisableCommandByName(name: string) {
  return await prisma.disableCommand.findFirst({
    where: {
      name,
    },
  });
}

export async function findDisableCommandStateByName(name: string) {
  return await prisma.disableCommand.findUnique({
    where: {
      name,
    },
  });
}

export async function createDisableCommand(name: string) {
  return await prisma.disableCommand.create({
    data: {
      name,
    },
  });
}

export async function deleteDisableCommandByName(name: string) {
  return await prisma.disableCommand.delete({
    where: {
      name,
    },
  });
}
