import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { runAnalysis } from "@/lib/ai/provider";

const requestSchema = z.object({
  clientName: z.string().min(1).max(100),
  weekLabel: z.string().min(1).max(50),
  conversation: z.string().min(50).max(50_000),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { clientName, weekLabel, conversation } = parsed.data;

  // Create a pending record
  const analysis = await db.analysis.create({
    data: {
      userId: auth.userId,
      clientName,
      weekLabel,
      rawConversation: conversation,
      llmProvider: process.env.LLM_PROVIDER ?? "gemini",
      promptVersion: "pending",
      llmOutputRaw: "",
      status: "PROCESSING",
    },
  });

  // Run LLM analysis
  try {
    const result = await runAnalysis(conversation, clientName, weekLabel);

    const updated = await db.analysis.update({
      where: { id: analysis.id },
      data: {
        llmProvider: result.provider,
        promptVersion: result.promptVersion,
        llmOutputRaw: JSON.stringify(result.output),
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        status: "COMPLETE",
      },
    });

    return NextResponse.json(
      {
        id: updated.id,
        status: "complete",
        output: result.output,
        meta: {
          provider: result.provider,
          promptVersion: result.promptVersion,
          tokensUsed: result.tokensUsed,
          latencyMs: result.latencyMs,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    await db.analysis.update({
      where: { id: analysis.id },
      data: { status: "FAILED" },
    });

    console.error("[analysis] LLM error:", err);
    return NextResponse.json(
      { error: "Analysis failed", message: String(err) },
      { status: 500 }
    );
  }
}