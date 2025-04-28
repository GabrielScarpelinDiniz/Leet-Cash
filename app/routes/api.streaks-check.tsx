import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "../../prisma/client";
import { getCurrentCompetition } from "~/services/competition.server";
import { getDayInterval } from "~/lib/utils";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (
    request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verifica qual usuário não fez check-in/commit no dia anterior, caso algum não tenha feito, zera o streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const { start: startOfYesterday, end: endOfYesterday } =
    getDayInterval(yesterday);

  console.log(startOfYesterday, endOfYesterday);
  // Get all users
  const users = await prisma.user.findMany();

  const currentCompetition = await getCurrentCompetition();
  if (!currentCompetition) {
    return new Response("No current competition", { status: 400 });
  }
  interface ResetResult {
    userId: string;
    name: string;
    streakReset: boolean;
  }

  const resetResults: ResetResult[] = [];

  await Promise.all(
    users.map(async (user) => {
      const yesterdayCommit = await prisma.commit.findFirst({
        where: {
          userId: user.id,
          date: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        },
      });

      if (!yesterdayCommit && currentCompetition.startDate <= yesterday) {
        await prisma.user.update({
          where: { id: user.id },
          data: { streaks: 0 },
        });
        resetResults.push({
          userId: user.id,
          name: user.email,
          streakReset: true,
        });
      }
    })
  );
  console.log("Streak check completed", {
    date: new Date().toISOString(),
    usersChecked: users.length,
    streaksReset: resetResults.length,
    details: resetResults,
  });

  return new Response(
    JSON.stringify({
      message: "Streak check completed",
      date: new Date().toISOString(),
      usersChecked: users.length,
      streaksReset: resetResults.length,
      details: resetResults,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
