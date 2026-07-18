export type { AnalysisOutput } from "@/lib/ai/schema";

export interface ReviewSection {
  original: Record<string, unknown>;
  edited: Record<string, unknown>;
  status: "approved" | "edited" | "pending";
}
