# Loom — AI website builder

Describe a website, watch it get built live, refine it in plain words, then push it to GitHub (with free GitHub Pages hosting) or deploy it to Vercel.

Built with Next.js (App Router), React Three Fiber / Three.js, Framer Motion, GSAP, and the Anthropic API.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | Generates the websites |
| `ANTHROPIC_MODEL` | No | Model override (default `claude-sonnet-5-5`) |
| `GITHUB_TOKEN` | No | Server fallback if a user doesn't paste their own token |
| `VERCEL_TOKEN` | No | Server fallback for Vercel deploys |
| `VERCEL_TEAM_ID` | No | Deploy into a Vercel team |

GitHub tokens need Contents, Administration and Pages (read/write) permissions. If you host Loom publicly, leave `GITHUB_TOKEN`/`VERCEL_TOKEN` empty so each person uses their own account.

## How it works

- `app/page.tsx` — landing page with a Three.js hero (`components/HeroScene.tsx`) where page blocks assemble into a layout.
- `app/builder` + `components/Builder.tsx` — chat panel, live streaming code view, sandboxed preview with desktop/tablet/phone widths, download.
- `app/api/generate` — streams a complete single-file site from Claude. Generated sites can use Three.js, GSAP, Lenis and Google Fonts from CDNs.
- `app/api/github` — creates (or updates) a repo, commits `index.html` + README, optionally turns on GitHub Pages.
- `app/api/deploy` — deploys the file to Vercel and returns the live URL.
- `lib/prompt.ts` — the system prompt. Edit it to change the style and rules of generated sites.

## Ideas for next steps

- Save projects (e.g. Postgres/Supabase) and add sign-in with GitHub OAuth instead of pasted tokens.
- Multi-file output (a full Next.js or Vite project) pushed as a Git tree via `octokit.git.createTree`.
- Netlify or Cloudflare Pages as extra deploy targets.
- Rate limiting on `/api/generate` before going public.
# loomai
