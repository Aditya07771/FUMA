"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STEPS = [
  "Reading conversation transcript…",
  "Extracting health metrics…",
  "Evaluating risks & barriers…",
  "Grounding evidence and checking for hallucinations…",
  "Finalising report…",
];

export function ProcessingState({ id }: { id: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Advance the visible step every 1.5 s
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 1500);
    return () => clearInterval(stepInterval);
  }, []);

  // Poll the API every 3 s and refresh when done
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${id}`);
        const data = await res.json();
        if (data.status === "COMPLETE" || data.status === "FAILED") {
          router.refresh();
        }
      } catch {
        // silent — just wait for next tick
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      {/* Spinner + headline */}
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xl font-semibold">Agentic analysis running…</p>
        <p className="text-sm text-muted-foreground">This usually takes 5–15 seconds.</p>
      </div>

      {/* Step checklist */}
      <div className="flex flex-col gap-2 min-w-[300px]">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${
                i > currentStep ? "opacity-30" : "opacity-100"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={done ? "text-muted-foreground line-through" : active ? "font-medium" : "text-muted-foreground"}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
