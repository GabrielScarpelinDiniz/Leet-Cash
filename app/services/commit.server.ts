import { prisma } from "prisma/client";

export const getIfHasTodayCommit = async (userId: string) => {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

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
