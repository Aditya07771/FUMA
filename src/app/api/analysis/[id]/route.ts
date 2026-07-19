import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { analysisOutputSchema } from "@/lib/ai/schema";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  const analysis = await db.analysis.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let parsedOutput = null;
  if (analysis.status === "COMPLETE" && analysis.llmOutputRaw) {
    try {
      const raw = JSON.parse(analysis.llmOutputRaw);
      const validated = analysisOutputSchema.safeParse(raw);
      parsedOutput = validated.success ? validated.data : null;
    } catch {
      parsedOutput = null;
    }
  }

  return NextResponse.json({
    id: analysis.id,
    status: analysis.status,
    clientName: analysis.clientName,
    weekLabel: analysis.weekLabel,
    llmProvider: analysis.llmProvider,
    promptVersion: analysis.promptVersion,
    tokensUsed: analysis.tokensUsed,
    latencyMs: analysis.latencyMs,
    createdAt: analysis.createdAt,
    output: parsedOutput,
  });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  const analysis = await db.analysis.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Cascade: delete associated reports then the analysis itself
  await db.report.deleteMany({ where: { analysisId: id } });
  await db.analysis.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}