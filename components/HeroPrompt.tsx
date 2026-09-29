"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroPrompt({ ideas }: { ideas: string[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function start() {
    const q = prompt.trim();
    router.push(q ? `/builder?prompt=${encodeURIComponent(q)}` : "/builder");
  }

  // One orchestrated load sequence for the hero; nothing else on the page animates on its own.
  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <motion.div
      className="hero-copy"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
    >
      <motion.span variants={item} className="badge">
        <span className="badge-dot" /> AI website builder · Three.js, GSAP & more
      </motion.span>
      <motion.h1 variants={item}>
        Describe a website.
        <br />
        <span className="gradient-text">Watch it get built.</span>
      </motion.h1>
      <motion.p variants={item} className="sub">
        Loom turns a few sentences into a finished site with real animation and 3D, then puts it on
        GitHub or live on the web.
      </motion.p>
      <motion.form
        variants={item}
        className="prompt-box"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <label htmlFor="hero-prompt" className="sr-only">
          What are you making?
        </label>
        <textarea
          id="hero-prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start();
          }}
          placeholder="A portfolio for a Lagos architect, with a rotating 3D model of a building in the hero"
        />
        <div className="row">
          <span className="hint">
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to start
          </span>
          <button className="btn btn-primary" type="submit">
            Build my site
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10m0 0L9 4m4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </motion.form>
      <motion.ul variants={item} className="idea-list" aria-label="Ideas to start from">
        {ideas.map((idea) => (
          <li key={idea}>
            <Link href={`/builder?prompt=${encodeURIComponent(idea)}`}>{idea}</Link>
          </li>
        ))}
      </motion.ul>
    </motion.div>
  );
}
