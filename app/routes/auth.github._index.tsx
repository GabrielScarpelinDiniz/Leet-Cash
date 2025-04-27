import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export async function loader() {
  // If someone visits this page directly, redirect them to login
  return redirect("/login");
}

export async function action({ request }: ActionFunctionArgs) {
  // This initiates the GitHub OAuth flow
  return authenticator.authenticate("github", request);
}
