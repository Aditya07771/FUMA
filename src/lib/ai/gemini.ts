import { GoogleGenerativeAI } from "@google/generative-ai";
import { compactAnalysisSchema, CompactAnalysis } from "./compactSchema";
import { analysisOutputSchema, AnalysisOutput } from "./schema";
import { normalizeAnalysisOutput } from "./normalize";
import { SYSTEM_PROMPT, buildUserPrompt, PROMPT_VERSION } from "./prompts";

function extractJson(text: string): string {
  const jsonBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlock) return jsonBlock[1].trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

async function callGemini(
  userPrompt: string,
  genAI: GoogleGenerativeAI
): Promise<{ text: string; tokensUsed: number }> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(userPrompt);
  return {
    text: result.response.text(),
    tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0,
  };
}

export async function analyseWithGemini(
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
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const userPrompt = buildUserPrompt(conversation, clientName, weekLabel);
  const start = Date.now();

  let rawJson: string;
  let tokensUsed: number;

  try {
    const res = await callGemini(userPrompt, genAI);
    rawJson = res.text;
    tokensUsed = res.tokensUsed;
  } catch (err) {
    throw new Error(`Gemini API error: ${String(err)}`);
  }

  const extracted = extractJson(rawJson);

  let compactParsed: CompactAnalysis;
  try {
    compactParsed = compactAnalysisSchema.parse(JSON.parse(extracted));
  } catch {
    console.error("[analysis] Compact parse failed. Retrying once.");
    console.error("[analysis] Raw LLM output:", rawJson.slice(0, 500));

    const retry = await callGemini(
      userPrompt +
        "\n\nYour previous output was invalid. You omitted required fields. Return ONLY the JSON object with all fields filled.",
      genAI
    );
    rawJson = retry.text;
    tokensUsed += retry.tokensUsed;

    const retryExtracted = extractJson(rawJson);
    compactParsed = compactAnalysisSchema.parse(JSON.parse(retryExtracted));
  }

  const normalized = normalizeAnalysisOutput(compactParsed, clientName, weekLabel);

  const validated = analysisOutputSchema.safeParse(normalized);
  if (!validated.success) {
    console.error("[analysis] Post-normalization validation failed");
    console.error("[analysis] Raw LLM output:", rawJson.slice(0, 500));
    console.error("[analysis] Normalized output:", JSON.stringify(normalized, null, 2));
    console.error("[analysis] Validation errors:", JSON.stringify(validated.error.flatten(), null, 2));
    throw new Error(
      `Validation failed after normalization: ${JSON.stringify(validated.error.flatten())}`
    );
  }

  const latencyMs = Date.now() - start;
  return {
    output: validated.data,
    rawJson,
    tokensUsed,
    latencyMs,
    promptVersion: PROMPT_VERSION,
  };
}
