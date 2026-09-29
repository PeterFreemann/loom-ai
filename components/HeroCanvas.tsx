"use client";

import dynamic from "next/dynamic";

// Three.js needs the browser, so the scene is loaded client-side only.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

export default function HeroCanvas() {
  return <HeroScene />;
}
