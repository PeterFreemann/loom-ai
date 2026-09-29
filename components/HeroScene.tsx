"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * A website "blueprint": page blocks (nav, hero, cards, footer) drift in from
 * scattered positions and snap into a finished layout, then breathe gently.
 */

type Block = { w: number; h: number; x: number; y: number; highlight?: boolean };

const LAYOUT: Block[] = [
  { w: 4.2, h: 0.28, x: 0, y: 2.05 }, // nav
  { w: 2.4, h: 1.2, x: -0.9, y: 1.05, highlight: true }, // hero copy
  { w: 1.6, h: 1.2, x: 1.3, y: 1.05 }, // hero visual
  { w: 1.26, h: 0.95, x: -1.47, y: -0.3 },
  { w: 1.26, h: 0.95, x: 0, y: -0.3 },
  { w: 1.26, h: 0.95, x: 1.47, y: -0.3 },
  { w: 4.2, h: 0.55, x: 0, y: -1.3 }, // band
  { w: 4.2, h: 0.24, x: 0, y: -1.95 }, // footer
];

const LINE = new THREE.Color("#C4B5FD");
const MARKER = new THREE.Color("#22D3EE");

function seeded(i: number) {
  const s = Math.sin(i * 91.7) * 43758.5453;
  return s - Math.floor(s);
}

function PageBlock({ block, index, reduced }: { block: Block; index: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const start = useMemo(
    () =>
      new THREE.Vector3(
        (seeded(index) - 0.5) * 9,
        (seeded(index + 7) - 0.5) * 7,
        (seeded(index + 13) - 0.5) * 6 - 1
      ),
    [index]
  );
  const startRot = useMemo(() => (seeded(index + 3) - 0.5) * 1.6, [index]);
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(block.w, block.h, 0.04)),
    [block]
  );
  const color = block.highlight ? MARKER : LINE;

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const delay = 0.35 + index * 0.12;
    const raw = reduced ? 1 : Math.min(Math.max((clock.elapsedTime - delay) / 1.4, 0), 1);
    const t = 1 - Math.pow(1 - raw, 4); // easeOutQuart
    g.position.set(
      THREE.MathUtils.lerp(start.x, block.x, t),
      THREE.MathUtils.lerp(start.y, block.y, t),
      THREE.MathUtils.lerp(start.z, 0, t) +
        (reduced ? 0 : Math.sin(clock.elapsedTime * 0.8 + index) * 0.04 * t)
    );
    g.rotation.z = THREE.MathUtils.lerp(startRot, 0, t);
  });

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[block.w, block.h, 0.04]} />
        <meshBasicMaterial color={color} transparent opacity={block.highlight ? 0.22 : 0.07} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

function Rig({ children, reduced }: { children: React.ReactNode; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  useFrame(() => {
    if (!group.current || reduced) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.35 - 0.25, 0.05);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.2 + 0.08, 0.05);
  });
  return (
    <group ref={group} rotation={[0.08, -0.25, 0]}>
      {children}
    </group>
  );
}

export default function HeroScene() {
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas camera={{ position: [0, 0, 7.2], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <Rig reduced={reduced}>
        <gridHelper args={[14, 28, "#27272A", "#18181B"]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.6]} />
        {LAYOUT.map((b, i) => (
          <PageBlock key={i} block={b} index={i} reduced={reduced} />
        ))}
      </Rig>
    </Canvas>
  );
}
