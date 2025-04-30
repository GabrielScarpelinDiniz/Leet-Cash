import { prisma } from "../../prisma/client";

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

export const getUsersRank = async (limit?: number) => {
  return await prisma.user.findMany({
    orderBy: [
      {
        challengesCompleted: "desc",
      },
      {
        streaks: "desc",
      },
      {
        updatedAt: "asc",
      },
    ],
    take: limit,
  });
};

export const createUser = async (data: {
  name: string;
  email: string;
  image: string;
}) => {
  return await prisma.user.create({
    data,
  });
};

export const updateUser = async (
  id: string,
  data: { name?: string; email?: string; image?: string }
) => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};

export const deleteUser = async (id: string) => {
  return await prisma.user.delete({
    where: { id },
  });
};

export const addChallengeCompleted = async (userId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      challengesCompleted: {
        increment: 1,
      },
      streaks: {
        increment: 1,
      },
    },
  });
};
