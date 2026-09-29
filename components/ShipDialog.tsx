"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { slugify } from "@/lib/prompt";

type Target = "github" | "vercel";

export default function ShipDialog({
  html,
  defaultName,
  onClose,
}: {
  html: string;
  defaultName: string;
  onClose: () => void;
}) {
  const [target, setTarget] = useState<Target>("github");
  const [name, setName] = useState(slugify(defaultName.split(/[,.]/)[0] || "my-site"));
  const [token, setToken] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [enablePages, setEnablePages] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<{ label: string; href: string }[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function ship() {
    setBusy(true);
    setError("");
    setLinks([]);
    try {
      const res =
        target === "github"
          ? await fetch("/api/github", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                html,
                repoName: name,
                description: defaultName,
                isPrivate,
                enablePages,
                token: token || undefined,
              }),
            })
          : await fetch("/api/deploy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ html, projectName: name, token: token || undefined }),
            });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (target === "github") {
        const out = [{ label: "Repository", href: data.repoUrl }];
        if (data.pagesUrl) out.push({ label: "GitHub Pages (live in about a minute)", href: data.pagesUrl });
        setLinks(out);
      } else {
        setLinks([{ label: "Live site", href: data.url }]);
      }
    } catch (err) {
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const doneLabel = target === "github" ? "Pushed to GitHub" : "Deployed";

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ship-title"
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2 id="ship-title">Ship your site</h2>

        <div className="segmented" role="group" aria-label="Where to ship">
          <button aria-pressed={target === "github"} onClick={() => { setTarget("github"); setLinks([]); setError(""); }}>
            Push to GitHub
          </button>
          <button aria-pressed={target === "vercel"} onClick={() => { setTarget("vercel"); setLinks([]); setError(""); }}>
            Deploy to Vercel
          </button>
        </div>

        <label className="field">
          {target === "github" ? "Repository name" : "Project name"}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="field">
          {target === "github" ? "GitHub token" : "Vercel token"}
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Leave empty to use the server's token"
            autoComplete="off"
          />
          <span className="hint">
            {target === "github" ? (
              <>Create one at <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noreferrer">github.com/settings</a> with Contents, Administration and Pages access. It’s sent only to push this site.</>
            ) : (
              <>Create one at <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer">vercel.com/account/tokens</a>. It’s sent only to deploy this site.</>
            )}
          </span>
        </label>

        {target === "github" && (
          <>
            <label className="check">
              <input type="checkbox" checked={enablePages} onChange={(e) => setEnablePages(e.target.checked)} />
              Host it free with GitHub Pages
            </label>
            <label className="check">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
              Make the repository private
            </label>
          </>
        )}

        {error && <p className="msg error" role="alert">{error}</p>}

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div className="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <strong>{doneLabel}.</strong>
              {links.map((l) => (
                <div key={l.href}>
                  {l.label}: <a href={l.href} target="_blank" rel="noreferrer">{l.href}</a>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="dialog-actions">
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={ship} disabled={busy || !name.trim()}>
            {busy ? (target === "github" ? "Pushing…" : "Deploying…") : target === "github" ? "Push to GitHub" : "Deploy to Vercel"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
