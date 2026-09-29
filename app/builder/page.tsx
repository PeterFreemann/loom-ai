import { Suspense } from "react";
import Builder from "@/components/Builder";

export const metadata = { title: "Builder — Loom" };

export default function BuilderPage() {
  return (
    <Suspense>
      <Builder />
    </Suspense>
  );
}
