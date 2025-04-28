import { prisma } from "prisma/client";
import { getDayInterval } from "~/lib/utils";

export const getIfHasTodayCommit = async (userId: string) => {
  const { start: startOfToday, end: endOfToday } = getDayInterval();

  return await prisma.commit.findFirst({
    where: {
      userId,
      createdAt: {
        gte: startOfToday,
        lt: endOfToday,
      },
    },
  });
};

export const getCommitById = async (id: string) => {
  return await prisma.commit.findUnique({
    where: { id },
  });
};

export const createCommit = async (data: {
  userId: string;
  competitionId: string;
  url: string;
  date: Date;
}) => {
  return await prisma.commit.create({
    data,
  });
};
