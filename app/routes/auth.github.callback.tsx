import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authenticator, sessionStorage } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.authenticate("github", request);
  console.log("User authenticated:", user);

  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );

  session.set("user", user);

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}
