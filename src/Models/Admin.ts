import { prisma } from "@/Models/db";

export async function findAdminByUserId(userId: string) {
  return await prisma.admin.findFirst({
    where: {
      userId,
    },
  });
}

export async function createAdmin(userId: string) {
  return await prisma.admin.create({
    data: {
      userId,
    },
  });
}

export async function deleteAdminByUserId(userId: string) {
  return await prisma.admin.delete({
    where: {
      userId,
    },
  });
}

export async function findAdminUniqueByUserId(userId: string) {
  return await prisma.admin.findUnique({
    where: {
      userId,
    },
  });
}
