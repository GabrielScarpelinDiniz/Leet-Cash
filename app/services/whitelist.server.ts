import { prisma } from "prisma/client";

export const getIfEmailIsWhitelisted = async (email: string) => {
  const whitelist = await prisma.whitelist.findUnique({
    where: { email },
  });
  return whitelist;
};
