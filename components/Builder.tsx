"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { extractHtml } from "@/lib/prompt";
import ShipDialog from "./ShipDialog";

type Message = { role: "user" | "status" | "error"; text: string };
type View = "preview" | "code";
type Device = "desktop" | "tablet" | "phone";

const DEVICE_WIDTH: Record<Device, string> = { desktop: "100%", tablet: "820px", phone: "390px" };

const STARTERS = [
  "A landing page for a Lagos food delivery app, with a Three.js globe in the hero",
  "A wedding website with a GSAP scroll story and RSVP form",
  "A photographer's portfolio with a masonry gallery and smooth scrolling",
];

export default function Builder() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [html, setHtml] = useState("");
  const [streamText, setStreamText] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [shipOpen, setShipOpen] = useState(false);
  const [firstPrompt, setFirstPrompt] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const generate = useCallback(
    async (prompt: string) => {
      const text = prompt.trim();
      if (!text || busy) return;
      setBusy(true);
      setInput("");
      setStreamText("");
      if (!firstPrompt) setFirstPrompt(text);
      setMessages((m) => [...m, { role: "user", text }, { role: "status", text: html ? "Updating your site…" : "Building your site…" }]);

      const controller = new AbortController();
      abortRef.current = controller;
      let full = "";
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, currentHtml: html || undefined }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(await res.text());

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setStreamText(full);
        }
        const result = extractHtml(full);
        if (!result.toLowerCase().includes("<html")) throw new Error("The response wasn't a complete page. Try again.");
        setHtml(result);
        setView("preview");
        setMessages((m) => [...m.slice(0, -1), { role: "status", text: "Done. Ask for changes, or ship it." }]);
      } catch (err) {
        const aborted = (err as Error).name === "AbortError";
        setMessages((m) => [
          ...m.slice(0, -1),
          aborted
            ? { role: "status", text: "Stopped. Your last version is unchanged." }
            : { role: "error", text: (err as Error).message || "Generation failed." },
        ]);
      } finally {
        setBusy(false);
        setStreamText("");
        abortRef.current = null;
      }
    },
    [busy, html, firstPrompt]
  );

  // Start automatically when arriving from the landing page with ?prompt=
  useEffect(() => {
    const p = params.get("prompt");
    if (p && !startedRef.current) {
      startedRef.current = true;
      // Remove ?prompt= from the URL so reloads or remounts can't fire it again.
      window.history.replaceState(null, "", "/builder");
      generate(p);
    }
  }, [params, generate]);

  // Keep the live code view scrolled to the newest line while streaming
  useEffect(() => {
    if (busy && codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight;
  }, [streamText, busy]);

  function download() {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const showCode = view === "code" || (busy && !html);
  const codeText = busy ? streamText : html;

  return (
    <div className="builder">
      <div className="builder-top">
        <Link href="/" className="logo">
          Loom
        </Link>
        <div className="spacer" />
        <div className="segmented" role="group" aria-label="View">
          {(["preview", "code"] as View[]).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
              {v === "preview" ? "Preview" : "Code"}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Screen width">
          {(["desktop", "tablet", "phone"] as Device[]).map((d) => (
            <button key={d} aria-pressed={device === d} onClick={() => setDevice(d)}>
              {d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn" onClick={download} disabled={!html || busy}>
          Download
        </button>
        <button className="btn btn-marker" onClick={() => setShipOpen(true)} disabled={!html || busy}>
          Ship it
        </button>
      </div>

      <aside className="sidebar">
        <div className="history" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty">
              <p>Describe the site you want. Be specific about the subject, the feel, and any effects.</p>
              <p>Try one of these:</p>
              <ul>
                {STARTERS.map((s) => (
                  <li key={s}>
                    <button onClick={() => generate(s)}>{s}</button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`msg ${m.role === "user" ? "" : m.role}`}>
                {m.text}
              </div>
            ))
          )}
        </div>
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            generate(input);
          }}
        >
          <label htmlFor="composer" className="hint">
            {html ? "What should change?" : "What are you making?"}
          </label>
          <textarea
            id="composer"
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(input);
            }}
            placeholder={html ? "Make the hero darker and add a pricing section" : "A bakery site with a spinning 3D croissant"}
            disabled={busy}
          />
          {busy ? (
            <button type="button" className="btn" onClick={() => abortRef.current?.abort()}>
              Stop
            </button>
          ) : (
            <button type="submit" className="btn btn-marker" disabled={!input.trim()}>
              {html ? "Update site" : "Build site"}
            </button>
          )}
        </form>
      </aside>

      <section className="stage" aria-label="Your site">
        <div className="stage-inner">
          {showCode && codeText ? (
            <pre className="code" ref={codeRef}>
              {codeText}
            </pre>
          ) : html ? (
            <iframe
              title="Site preview"
              className="frame"
              style={{ maxWidth: DEVICE_WIDTH[device] }}
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
              srcDoc={html}
            />
          ) : (
            <p className="placeholder">
              {busy ? "Starting…" : "Your site will appear here as soon as you describe it."}
            </p>
          )}
        </div>
      </section>

      {shipOpen && <ShipDialog html={html} defaultName={firstPrompt} onClose={() => setShipOpen(false)} />}
    </div>
  );
}