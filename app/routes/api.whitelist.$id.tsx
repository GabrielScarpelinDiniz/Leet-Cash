import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "prisma/client";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const apiKey = request.headers.get("X-Request-Authorization");
  if (apiKey !== process.env.API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response("ID é obrigatório na URL", { status: 400 });
  }

  // Converte ID para número (ajuste se for string/UUID)
  const recordId = Number(id);
  if (isNaN(recordId)) {
    return new Response("ID inválido", { status: 400 });
  }

  switch (request.method) {
    case "DELETE":
      try {
        await prisma.whitelist.delete({ where: { id: recordId } });
        return new Response("Whitelist entry deleted", { status: 200 });
      } catch (e) {
        console.error(e);
        return new Response("Erro ao deletar", { status: 500 });
      }

    case "PUT":
      try {
        const { email } = await request.json();
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof email !== "string" || !regexEmail.test(email)) {
          return new Response("Formato de email inválido", { status: 400 });
        }

        const updated = await prisma.whitelist.update({
          where: { id: recordId },
          data: { email },
        });
        return new Response(JSON.stringify(updated), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error(e);
        return new Response("Erro ao atualizar", { status: 500 });
      }

    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
};
