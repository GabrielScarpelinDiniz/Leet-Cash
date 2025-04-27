import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "prisma/client";

export const action = async ({ request }: ActionFunctionArgs) => {
  const apiKey = request.headers.get("X-Request-Authorization");
  if (apiKey !== process.env.API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const jsonData = await request.json();

  if (!jsonData) {
    return new Response("Invalid data", { status: 400 });
  }

  if (jsonData.emails) {
    if (!jsonData || !jsonData.emails) {
      return new Response("Invalid data", { status: 400 });
    }
    const emails = Array.isArray(jsonData.emails)
      ? jsonData.emails
      : [jsonData.emails];
    // Validate emails
    const regexForEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !emails.every(
        (email: string) =>
          typeof email === "string" &&
          email.includes("@") &&
          regexForEmail.test(email)
      )
    ) {
      return new Response("Invalid email format", { status: 400 });
    }
    // Update whitelist
    await prisma.whitelist.createMany({
      data: emails.map((email: string) => ({
        email,
      })),
      skipDuplicates: true,
    });

    return new Response("Whitelist updated successfully", { status: 200 });
  } else if (jsonData.email) {
    const email = jsonData.email;
    // Validate email
    const regexForEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      typeof email !== "string" ||
      !email.includes("@") ||
      !regexForEmail.test(email)
    ) {
      return new Response("Invalid email format", { status: 400 });
    }
    // Update whitelist
    await prisma.whitelist.create({
      data: {
        email,
      },
    });

    return new Response("Whitelist updated successfully", { status: 200 });
  } else {
    return new Response("Invalid data", { status: 400 });
  }
};
