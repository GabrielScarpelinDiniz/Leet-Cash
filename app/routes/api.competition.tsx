import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "prisma/client";
import { getCurrentCompetition } from "~/services/competition.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // This routes if for creating a new competition
  // use json to parse the body

  const jsonData = await request.json();

  const apiKey = request.headers.get("X-Request-Authorization");
  if (apiKey !== process.env.API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { name, startDate, endDate, repo, owner } = jsonData;

  // Validate presence
  if (!name || !startDate || !endDate || !repo || !owner) {
    return new Response("Invalid data", { status: 400 });
  }

  // Added input validation for competition creation
  if (
    !name ||
    typeof name !== "string" ||
    name.length < 3 ||
    name.length > 50
  ) {
    return new Response("Invalid competition name", { status: 400 });
  }

  // Validate name
  if (typeof name !== "string" || name.length < 3 || name.length > 50) {
    return new Response("Name must be a string between 3 and 50 characters", {
      status: 400,
    });
  }

  // Validate repo
  if (typeof repo !== "string" || repo.length < 1 || repo.length > 100) {
    return new Response("Repo must be a string between 1 and 100 characters", {
      status: 400,
    });
  }

  // Validate owner
  if (typeof owner !== "string" || owner.length < 1 || owner.length > 100) {
    return new Response("Owner must be a string between 1 and 100 characters", {
      status: 400,
    });
  }

  // Validate date types
  if (typeof startDate !== "string" || typeof endDate !== "string") {
    return new Response("Dates must be strings", { status: 400 });
  }

  // Parse dates once
  const start = new Date(startDate);
  const end = new Date(endDate);

  console.log("Start date:", start);
  console.log("End date:", end);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return new Response("Start and End dates must be valid dates", {
      status: 400,
    });
  }

  function stripTimeUTC(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
  }

  const today = stripTimeUTC(new Date());

  console.log(today);

  if (start >= end) {
    return new Response("Start date must be before end date", { status: 400 });
  }

  if (start < today || end <= today) {
    return new Response("Dates must be in the future", { status: 400 });
  }

  // check if there is already a competition
  const currentCompetition = await getCurrentCompetition();
  if (currentCompetition) {
    return new Response("There is already a competition", { status: 400 });
  }
  // create the competition

  const competition = await prisma.competition.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      repo,
      owner,
    },
  });

  return new Response(JSON.stringify(competition), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
