import { prisma } from "@/Models/db";
import { invalidateIsAdmin } from "@/Models/isAdmin";

export async function findAdminByUserId(userId: string) {
  return await prisma.admin.findFirst({
    where: {
      userId,
    },
  });
}

export async function createAdmin(userId: string) {
  const created = await prisma.admin.create({
    data: {
      userId,
    },
  });
  invalidateIsAdmin(userId);
  return created;
}

export async function deleteAdminByUserId(userId: string) {
  const deleted = await prisma.admin.delete({
    where: {
      userId,
    },
  });
  invalidateIsAdmin(userId);
  return deleted;
}

export async function findAdminUniqueByUserId(userId: string) {
  return await prisma.admin.findUnique({
    where: {
      userId,
    },
  });
}
