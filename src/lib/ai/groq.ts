import Groq from "groq-sdk";
import { compactAnalysisSchema, CompactAnalysis } from "./compactSchema";
import { analysisOutputSchema, AnalysisOutput } from "./schema";
import { normalizeAnalysisOutput } from "./normalize";
import { SYSTEM_PROMPT, buildUserPrompt, PROMPT_VERSION } from "./prompts";
import { coerceCompact } from "./coerce";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── JSON extraction ───────────────────────────────────────────────

function extractJson(text: string): string {
  // Strip markdown fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Fall back to first { ... last }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);

  return text.trim();
}

// ── Groq call ─────────────────────────────────────────────────────

async function callGroq(userPrompt: string): Promise<{
  text: string;
  tokensUsed: number;
}> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    max_completion_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  return {
    text: completion.choices[0]?.message?.content ?? "{}",
    tokensUsed: completion.usage?.total_tokens ?? 0,
  };
}

// ── Parse pipeline ────────────────────────────────────────────────

/**
 * JSON.parse → coerceCompact (fixes shape errors) → Zod parse
 */
function parseAndCoerce(rawText: string): CompactAnalysis {
  const extracted = extractJson(rawText);
  const raw = JSON.parse(extracted);          // throws on invalid JSON
  const coerced = coerceCompact(raw);         // fixes shape / type errors
  return compactAnalysisSchema.parse(coerced); // final validation
}

// ── Main export ───────────────────────────────────────────────────

export async function analyseWithGroq(
  conversation: string,
  clientName: string,
  weekLabel: string
): Promise<{
  output: AnalysisOutput;
  rawJson: string;
  tokensUsed: number;
  latencyMs: number;
  promptVersion: string;
}> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const userPrompt = buildUserPrompt(conversation, clientName, weekLabel);
  const start = Date.now();

  let rawJson = "{}";
  let tokensUsed = 0;

  // ── First attempt ────────────────────────────────────────────
  const first = await callGroq(userPrompt);
  rawJson = first.text;
  tokensUsed += first.tokensUsed;

  let compact: CompactAnalysis;

  try {
    compact = parseAndCoerce(rawJson);
  } catch (err) {
    // ── Single retry with explicit reminder ──────────────────
    console.warn("[groq] First attempt failed, retrying:", String(err).slice(0, 200));

    const retry = await callGroq(
      userPrompt +
        "\n\nCRITICAL: Your previous response was invalid. " +
        "Return ONLY the JSON object shown in the template. " +
        "symptoms, pendingActions, and riskFlags MUST be arrays of objects — not plain strings. " +
        "Every field is required."
    );
    rawJson = retry.text;
    tokensUsed += retry.tokensUsed;

    try {
      compact = parseAndCoerce(rawJson);
    } catch (retryErr) {
      console.error("[groq] Retry also failed:", retryErr);
      throw new Error(`LLM output could not be parsed after retry: ${String(retryErr)}`);
    }
  }

  // ── Normalize compact → full schema ──────────────────────────
  const normalized = normalizeAnalysisOutput(compact, clientName, weekLabel);

  const validated = analysisOutputSchema.safeParse(normalized);
  if (!validated.success) {
    console.error("[groq] Post-normalization validation failed:");
    console.error(JSON.stringify(validated.error.flatten(), null, 2));
    throw new Error("Normalized output failed final validation.");
  }

  return {
    output: validated.data,
    rawJson,
    tokensUsed,
    latencyMs: Date.now() - start,
    promptVersion: PROMPT_VERSION,
  };
}