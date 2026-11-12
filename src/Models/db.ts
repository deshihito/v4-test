import { PrismaClient } from "@/generated";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/util/Env";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 10 * 60 * 1000,
    timeout: 2 * 60 * 1000,
  },
});
