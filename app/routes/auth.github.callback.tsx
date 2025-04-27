import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authenticator, sessionStorage } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.authenticate("github", request);
  console.log("User authenticated:", user);
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );

  // Added state parameter verification for GitHub OAuth
  const state = new URL(request.url).searchParams.get("state");
  if (!state || state !== session.get("oauth_state")) {
    return redirect("/login", { status: 400 });
  }

  session.set("user", user);

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}
