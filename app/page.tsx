import Link from "next/link";
import HeroCanvas from "@/components/HeroCanvas";
import HeroPrompt from "@/components/HeroPrompt";

const IDEAS = [
  "A coffee roastery with beans that scatter as you scroll",
  "A synth-wave music festival with a Three.js neon grid",
  "A calm yoga studio with slow GSAP text reveals",
  "A developer portfolio with an interactive particle field",
  "A restaurant menu page with a parallax food gallery",
  "A SaaS launch page with a 3D product that follows the cursor",
];

const STEPS = [
  {
    title: "Describe it",
    body: "Say what the site is for, who it’s for, and the feel you want. Mention Three.js, GSAP or any effect by name.",
  },
  {
    title: "Refine it",
    body: "See it live as it’s written. Ask for changes in plain words until it’s right, and check it on phone and desktop widths.",
  },
  {
    title: "Ship it",
    body: "Push it to a new GitHub repo with Pages turned on, deploy it to Vercel, or download the file.",
  },
];

export default function Home() {
  return (
    <main className="landing">
      <div className="bg-glow" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />

      <header className="site-header">
        <Link href="/" className="logo">
          <span className="logo-mark" aria-hidden="true" />
          Loom
        </Link>
        <nav className="header-nav">
          <a href="#how">How it works</a>
          <Link href="/builder" className="btn btn-primary btn-sm">
            Open the builder
          </Link>
        </nav>
      </header>

      <section className="hero">
        <HeroPrompt ideas={IDEAS} />
      </section>

      <section className="showcase" aria-hidden="true">
        <div className="window">
          <div className="window-bar">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
            <span className="url">loom.site/your-idea</span>
          </div>
          <div className="window-body">
            <HeroCanvas />
          </div>
        </div>
      </section>

      <section className="steps" aria-labelledby="how">
        <p className="eyebrow">How it works</p>
        <h2 id="how">From an idea to a live link in three moves</h2>
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.title} className="card">
              <span className="num">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="cta">
        <h2>Your next site is one sentence away.</h2>
        <p>Sites are single HTML files you own. No lock-in, no templates.</p>
        <Link href="/builder" className="btn btn-primary btn-lg">
          Start building
        </Link>
      </section>

      <footer className="site-footer">
        <span className="logo">
          <span className="logo-mark" aria-hidden="true" />
          Loom
        </span>
        <span>Describe it. Refine it. Ship it.</span>
      </footer>
    </main>
  );
}
