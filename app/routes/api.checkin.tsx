import { ActionFunctionArgs } from "@remix-run/node";
import { getDayInterval } from "~/lib/utils";
import { sessionStorage } from "~/services/auth.server";
import { createCommit, getIfHasTodayCommit } from "~/services/commit.server";
import { getCurrentCompetition } from "~/services/competition.server";
import { addChallengeCompleted } from "~/services/user.server";

type GitHubCommit = {
  url: string;
  sha: string;
  node_id: string;
  html_url: string;
  comments_url: string;
  commit: {
    url: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      url: string;
      sha: string;
    };
    comment_count: number;
    verification: {
      verified: boolean;
      reason: string;
      signature: string | null;
      payload: string | null;
      verified_at: string | null;
    };
  };
  author: {
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
  };
  committer: {
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
  };
  parents: Array<{
    url: string;
    sha: string;
  }>;
};

const processingUsers = new Set<string>();

export const action = async ({ request }: ActionFunctionArgs) => {
  // This routes if for creating a new competition
  // use json to parse the body

  const jsonData = await request.json();

  const user = (
    await sessionStorage.getSession(request.headers.get("cookie"))
  ).get("user");

  const { userId, competitionId, repo, owner } = jsonData;

  if (!userId || !user || userId !== user.id) {
    console.error("User not found", { userId, user });
    return new Response("Unauthorized", { status: 401 });
  }

  if (processingUsers.has(userId)) {
    console.error("User already processing", { userId });
    return new Response("Already processing", { status: 400 });
  }

  processingUsers.add(userId);

  try {
    const hasCommitToday = await getIfHasTodayCommit(userId);

    if (hasCommitToday) {
      console.error("User already committed today", { userId });
      return new Response("Already committed today", { status: 400 });
    }

    const currentCompetition = await getCurrentCompetition();

    if (!currentCompetition) {
      console.error("No current competition", { userId });
      return new Response("No current competition", { status: 400 });
    }
    if (currentCompetition.id !== competitionId) {
      console.error("Competition not found", { competitionId });
      return new Response("Competition not found", { status: 400 });
    }
    if (currentCompetition.repo !== repo) {
      console.error("Repo not found", { repo });
      return new Response("Repo not found", { status: 400 });
    }
    if (currentCompetition.owner !== owner) {
      console.error("Owner not found", { owner });
      return new Response("Owner not found", { status: 400 });
    }
    // List github commits
    const githubToken = process.env.GITHUB_CLASSIC_TOKEN;
    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/commits?since=${currentCompetition.startDate}&until=${currentCompetition.endDate}`;

    const response = await fetch(githubUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) {
      console.error("GitHub API error", {
        status: response.status,
        body: await response.text(),
      });
      return new Response("Failed to fetch commits", { status: 500 });
    }
    const commits = (await response.json()) as GitHubCommit[];

    // Check if the user has any commits today
    const { start: startOfToday, end: endOfToday } = getDayInterval();

    const userCommits = commits.filter((commit) => {
      const { committer, author, commit: commitInfo } = commit;
      // skip any commits not tied to a GitHub user
      if (!committer) return false;

      const commitDate = new Date(commitInfo.committer.date);
      const committerLogin = committer.login;
      const authorLogin = author?.login;
      const commitAuthorEmail = commitInfo.author.email;

      const isUserCommit =
        committerLogin === user.name ||
        authorLogin === user.name ||
        (committerLogin === "web-flow" && commitAuthorEmail === user.email);

      return (
        isUserCommit && commitDate >= startOfToday && commitDate < endOfToday
      );
    });

    if (userCommits.length === 0) {
      console.error("No commits found for today", { userId });
      return new Response("No commits found for today", { status: 400 });
    }

    const doubleCheck = await getIfHasTodayCommit(userId);
    if (doubleCheck) {
      console.error("Race condition detected - user already committed today", {
        userId,
      });
      return new Response("Already committed today", { status: 400 });
    }

    const commit = await createCommit({
      userId,
      competitionId: currentCompetition.id,
      url: userCommits[userCommits.length - 1].html_url,
      date: new Date(userCommits[userCommits.length - 1].commit.committer.date),
    });

    await addChallengeCompleted(userId);
    return new Response(
      JSON.stringify({
        message: "Commit created",
        commit,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing commit", { userId, error });
    return new Response("Internal server error", { status: 500 });
  } finally {
    processingUsers.delete(userId);
  }
};
