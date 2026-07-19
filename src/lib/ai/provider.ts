/**
 * LLM Provider Abstraction
 * ─────────────────────────────────────────────────────────────────
 * The rest of the app calls ONLY runAnalysis() from this file.
 * To swap Gemini for Claude or OpenAI, add a new adapter file and
 * add a case here. No other file needs to change.
 */

import { AnalysisOutput } from "./schema";

export type LLMResult = {
  output: AnalysisOutput;
  rawJson: string;
  tokensUsed: number;
  latencyMs: number;
  promptVersion: string;
  provider: string;
};

export async function runAnalysis(
  conversation: string,
  clientName: string,
  weekLabel: string
): Promise<LLMResult> {
  const provider = process.env.LLM_PROVIDER ?? "gemini";

  switch (provider) {
    case "gemini": {
      const { analyseWithGemini } = await import("./gemini");
      const result = await analyseWithGemini(
        conversation,
        clientName,
        weekLabel
      );
      return { ...result, provider: "gemini" };
    }
    case "groq": {
      const { analyseWithGroq } = await import("./groq");
      const result = await analyseWithGroq(
        conversation,
        clientName,
        weekLabel
      );
      return { ...result, provider: "groq" };
    }

    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}