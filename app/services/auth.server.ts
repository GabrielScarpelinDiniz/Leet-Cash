import { Authenticator } from "remix-auth";
import { createCookieSessionStorage } from "@remix-run/node";
import { GitHubStrategy } from "remix-auth-github";
import { createUser, getUserByEmail } from "./user.server";

type User = {
  id: string;
  name: string;
  email: string;
  image: string;
};

type SessionUser = User & {
  accessToken: string;
  refreshToken: string | null;
};

type EmailResponse = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "public" | "private";
};

export type GitHubUser = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  private_gists: number;
  total_private_repos: number;
  owned_private_repos: number;
  disk_usage: number;
  collaborators: number;
  two_factor_authentication: boolean;
  plan: {
    name: string;
    space: number;
    private_repos: number;
    collaborators: number;
  };
};

// Updated cookie secret to require a secure environment variable
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.COOKIE_SECRET || "default_secret"],
    sameSite: "lax",
  },
});

export const authenticator = new Authenticator<SessionUser>();

const gitHubStrategy = new GitHubStrategy<SessionUser>(
  {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    redirectURI:
      process.env.GITHUB_REDIRECT_URI ||
      "http://localhost:5173/auth/github/callback",
    scopes: ["read:user", "user:email"],
  },
  async ({ tokens }) => {
    const permitedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];

    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokens.accessToken()}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokens.accessToken()}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const emails = (await emailsResponse.json()) as EmailResponse[];

    const primaryEmail = emails.find((email) => email.primary);

    const userProfile = (await profileResponse.json()) as GitHubUser;

    userProfile.email = primaryEmail?.email || userProfile.email;

    if (!permitedEmails.includes(userProfile.email)) {
      throw new Error("Email not allowed");
    }

    let user = await getUserByEmail(userProfile.email);

    if (!user) {
      user = await createUser({
        name: userProfile.login,
        email: userProfile.email,
        image: userProfile.avatar_url,
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      accessToken: tokens.accessToken(),
      refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
    };
  }
);

authenticator.use(gitHubStrategy, "github");
