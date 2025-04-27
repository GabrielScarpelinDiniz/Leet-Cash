import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { sessionStorage } from "~/services/auth.server";
import { getUserById } from "~/services/user.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const user = session.get("user");

  if (!user) {
    return redirect("/login");
  }

  const userBd = await getUserById(user.id);

  if (!userBd) {
    return redirect("/login");
  }

  return redirect("/dashboard");
};
