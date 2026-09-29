import { slugify } from "@/lib/prompt";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { html, projectName, token: userToken } = (await req.json()) as {
    html?: string;
    projectName?: string;
    token?: string;
  };
  const token = userToken || process.env.VERCEL_TOKEN;
  if (!token) return Response.json({ error: "Add a Vercel token to deploy." }, { status: 400 });
  if (!html) return Response.json({ error: "Build a site before deploying it." }, { status: 400 });

  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const res = await fetch(`https://api.vercel.com/v13/deployments${team}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: slugify(projectName || "loom-site"),
      target: "production",
      files: [{ file: "index.html", data: html }],
      projectSettings: { framework: null },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return Response.json(
      { error: `Vercel: ${data?.error?.message ?? "deployment failed."}` },
      { status: 502 }
    );
  }
  const alias: string | undefined = data.alias?.[0];
  return Response.json({ url: `https://${alias ?? data.url}`, inspectorUrl: data.inspectorUrl });
}
