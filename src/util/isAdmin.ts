import { prisma } from "@/Models/db";

const isAdmin = async (userId: string): Promise<boolean> => {
  return !!(await prisma.admin.findFirst({
    select: { userId: true },
    where: { userId },
  }));
};

export default isAdmin;
