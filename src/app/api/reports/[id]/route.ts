import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import type { Prisma } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  const report = await db.report.findFirst({
    where: { id, userId: auth.userId },
    include: {
      analysis: {
        select: {
          llmProvider: true,
          promptVersion: true,
          tokensUsed: true,
          latencyMs: true,
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

const patchSchema = z.object({
  sections: z.record(z.string(), z.unknown()).optional(),
  coachNotes: z.string().max(2000).optional(),
  status: z.enum(["APPROVED", "EDITED", "REJECTED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const existing = await db.report.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.report.update({
    where: { id },
    data: {
      ...(parsed.data as Prisma.ReportUpdateInput),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}