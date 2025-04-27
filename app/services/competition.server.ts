import { prisma } from "prisma/client";

export const getCurrentCompetition = async () => {
  return await prisma.competition.findFirst({
    where: {
      startDate: {
        lte: new Date(),
      },
      endDate: {
        gte: new Date(),
      },
    },
  });
};
