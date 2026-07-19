import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import type { Prisma } from "@prisma/client";

const saveReportSchema = z.object({
  analysisId: z.string().cuid(),
  sections: z.record(z.string(), z.unknown()),
  coachNotes: z.string().max(2000).optional(),
  status: z.enum(["APPROVED", "EDITED", "REJECTED"]),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = saveReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { analysisId, sections, coachNotes, status } = parsed.data;

  const analysis = await db.analysis.findFirst({
    where: { id: analysisId, userId: auth.userId },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const report = await db.report.upsert({
    where: { analysisId },
    update: {
      sections: sections as unknown as Prisma.InputJsonValue,
      coachNotes,
      status,
      approvedAt: new Date(),
    },
    create: {
      analysisId,
      userId: auth.userId,
      clientName: analysis.clientName,
      weekLabel: analysis.weekLabel,
      sections: sections as unknown as Prisma.InputJsonValue,
      coachNotes,
      status,
      approvedAt: new Date(),
    },
  });

  return NextResponse.json(report, { status: 201 });
}

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const reports = await db.report.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      clientName: true,
      weekLabel: true,
      status: true,
      approvedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ reports });
}