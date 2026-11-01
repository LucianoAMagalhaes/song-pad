import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TheoryPrototype } from "./TheoryPrototype";

/** Three throwaway UI variants on /theory/prototype, selected with ?variant=. */
export default function TheoryPrototypePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense fallback={<p className="p-8 text-muted">A preparar o braço...</p>}>
      <TheoryPrototype />
    </Suspense>
  );
}
