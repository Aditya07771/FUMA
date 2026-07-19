import { z } from "zod";

export const compactAnalysisSchema = z.object({
  overallStatus: z.enum(["good", "moderate", "poor"]),
  weeklyTrend: z.enum(["improving", "stable", "declining"]),
  coachAttentionRequired: z.boolean(),
  nutrition: z.object({
    score: z.number().min(0).max(10),
    adherence: z.string(),
    protein: z.string(),
    mealTiming: z.string(),
    skippedMeals: z.number().int().min(0),
    keyFoods: z.array(z.string()).max(10),
  }),
  exercise: z.object({
    score: z.number().min(0).max(10),
    avgSteps: z.number().int().min(0),
    activities: z.array(z.string()).max(10),
    sessions: z.number().int().min(0),
    note: z.string(),
  }),
  sleep: z.object({
    score: z.number().min(0).max(10),
    avgHours: z.number().min(0).max(24),
    trend: z.enum(["improving", "stable", "declining"]),
    note: z.string(),
  }),
  water: z.object({
    score: z.number().min(0).max(10),
    avgLitres: z.number().min(0),
    note: z.string(),
  }),
  symptoms: z
    .array(
      z.object({
        name: z.string(),
        severity: z.enum(["mild", "moderate", "severe"]),
        firstSeen: z.string(),
        latestMention: z.string(),
        evidenceType: z.enum([
          "confirmed_fact",
          "client_report",
          "ai_inference",
          "unavailable",
        ]),
        quote: z.string(),
      })
    )
    .max(5),
  stress: z.object({
    score: z.number().min(0).max(10),
    level: z.enum(["low", "moderate", "high"]),
    reasons: z.array(z.string()).max(3),
    note: z.string(),
  }),
  engagement: z.object({
    score: z.number().min(0).max(10),
    messagesSent: z.number().int().min(0),
    coachReplies: z.number().int().min(0),
    missedCalls: z.number().int().min(0),
    rating: z.enum(["excellent", "good", "moderate", "poor"]),
    note: z.string(),
  }),
  barriers: z.array(z.string()).max(5),
  pendingActions: z
    .array(
      z.object({
        action: z.string(),
        owner: z.enum(["client", "coach"]),
        priority: z.enum(["high", "medium", "low"]),
      })
    )
    .max(8),
  riskFlags: z
    .array(
      z.object({
        flag: z.string(),
        reason: z.string(),
        evidenceType: z.enum([
          "confirmed_fact",
          "client_report",
          "ai_inference",
          "unavailable",
        ]),
      })
    )
    .max(5),
  riskLevel: z.enum(["low", "medium", "high"]),
  recommendations: z.array(z.string()).max(5),
});

export type CompactAnalysis = z.infer<typeof compactAnalysisSchema>;
