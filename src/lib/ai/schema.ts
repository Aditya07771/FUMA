import { z } from "zod";

// ── reusable pieces ──────────────────────────────────────────────

const evidenceType = z.enum([
  "confirmed_fact",
  "client_report",
  "ai_inference",
  "unavailable",
]);

const evidenceItem = z.object({
  day: z.string(),
  quote: z.string(),
});

const metricBlock = z.object({
  value: z.string(),
  status: z.enum(["good", "moderate", "poor", "unknown"]),
  evidenceType: evidenceType,
  confidence: z.number().min(0).max(100),
  evidence: z.array(evidenceItem).max(5),
  notes: z.string().optional(),
});

// ── main schema ──────────────────────────────────────────────────

export const analysisOutputSchema = z.object({
  clientName: z.string(),
  weekLabel: z.string(),
  overallStatus: z.enum(["good", "moderate", "poor"]),
  weeklyTrend: z.enum(["improving", "stable", "declining"]),
  coachAttentionRequired: z.boolean(),

  nutrition: z.object({
    adherence: metricBlock,
    proteinAdequacy: metricBlock,
    mealTiming: metricBlock,
    skippedMeals: z.number().int().min(0),
    keyFoods: z.array(z.string()).max(10),
  }),

  exercise: z.object({
    averageSteps: z.number().int().min(0),
    activitiesMentioned: z.array(z.string()),
    exerciseSessions: z.number().int().min(0),
    summary: metricBlock,
  }),

  sleep: z.object({
    averageHours: z.number().min(0).max(24),
    trend: z.enum(["improving", "stable", "declining"]),
    summary: metricBlock,
  }),

  water: z.object({
    averageLitres: z.number().min(0),
    summary: metricBlock,
  }),

  symptoms: z.array(
    z.object({
      name: z.string(),
      severity: z.enum(["mild", "moderate", "severe"]),
      firstSeen: z.string(),
      latestMention: z.string(),
      evidenceType: evidenceType,
      evidence: z.array(evidenceItem).max(3),
    })
  ),

  stress: z.object({
    level: z.enum(["low", "moderate", "high"]),
    reasons: z.array(z.string()),
    summary: metricBlock,
  }),

  engagement: z.object({
    messagesSent: z.number().int().min(0),
    coachReplies: z.number().int().min(0),
    missedCalls: z.number().int().min(0),
    consistencyRating: z.enum(["excellent", "good", "moderate", "poor"]),
    summary: metricBlock,
  }),

  keyBarriers: z.array(z.string()).max(5),

  pendingActions: z.array(
    z.object({
      action: z.string(),
      owner: z.enum(["client", "coach"]),
      priority: z.enum(["high", "medium", "low"]),
    })
  ).max(8),

  riskFlags: z.array(
    z.object({
      flag: z.string(),
      reason: z.string(),
      evidenceType: evidenceType,
    })
  ).max(5),

  riskLevel: z.enum(["low", "medium", "high"]),
  recommendedNextActions: z.array(z.string()).max(5),

  hallucination_guard: z.object({
    unsupportedClaims: z.array(z.string()),
    lowConfidenceFindings: z.array(z.string()),
  }),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;