import { prisma } from "@/Models/db";
import TtlCache from "@/util/ttlCache";

const adminCache = new TtlCache<boolean>(60_000);

export function invalidateIsAdmin(userId: string): void {
  adminCache.delete(userId);
}

const isAdmin = async (userId: string): Promise<boolean> => {
  return adminCache.getOrLoad(
    userId,
    async () =>
      !!(await prisma.admin.findFirst({
        select: { userId: true },
        where: { userId },
      })),
  );
};

export default isAdmin;
