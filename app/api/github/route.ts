import { Octokit } from "@octokit/rest";
import { slugify } from "@/lib/prompt";

export const runtime = "nodejs";

type Body = {
  html: string;
  repoName: string;
  description?: string;
  isPrivate?: boolean;
  enablePages?: boolean;
  token?: string;
};

async function upsertFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
) {
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data) && "sha" in data) sha = data.sha;
  } catch {
    // File doesn't exist yet.
  }
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    sha,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const token = body.token || process.env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: "Add a GitHub token to push your site." }, { status: 400 });
  if (!body.html) return Response.json({ error: "Build a site before pushing it." }, { status: 400 });

  const octokit = new Octokit({ auth: token });
  const repo = slugify(body.repoName);

  try {
    const { data: user } = await octokit.users.getAuthenticated();
    const owner = user.login;

    let created = false;
    try {
      await octokit.repos.get({ owner, repo });
    } catch {
      await octokit.repos.createForAuthenticatedUser({
        name: repo,
        description: body.description?.slice(0, 300) || "Built with Loom",
        private: !!body.isPrivate,
      });
      created = true;
    }

    await upsertFile(
      octokit,
      owner,
      repo,
      "index.html",
      body.html,
      created ? "Initial site from Loom" : "Update site from Loom"
    );
    if (created) {
      await upsertFile(
        octokit,
        owner,
        repo,
        "README.md",
        `# ${repo}\n\n${body.description ?? ""}\n\nBuilt with Loom. Open \`index.html\` in a browser, or turn on GitHub Pages to host it.\n`,
        "Add README"
      );
    }

    let pagesUrl: string | undefined;
    if (body.enablePages) {
      try {
        const { data: pages } = await octokit.request("POST /repos/{owner}/{repo}/pages", {
          owner,
          repo,
          source: { branch: "main", path: "/" },
        });
        pagesUrl = pages.html_url ?? undefined;
      } catch {
        // Pages is probably already on (or unavailable for a private repo on a free plan).
        pagesUrl = `https://${owner}.github.io/${repo}/`;
      }
    }

    return Response.json({ repoUrl: `https://github.com/${owner}/${repo}`, pagesUrl, created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "request failed.";
    return Response.json({ error: `GitHub: ${message}` }, { status: 502 });
  }
}
