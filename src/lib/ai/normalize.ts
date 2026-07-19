import { CompactAnalysis } from "./compactSchema";
import { AnalysisOutput } from "./schema";

function scoreToMetric(score: number, note: string) {
  const status =
    score >= 7 ? ("good" as const) : score >= 4 ? ("moderate" as const) : ("poor" as const);
  const evidenceType =
    score >= 7 ? ("confirmed_fact" as const) : score >= 4 ? ("client_report" as const) : ("ai_inference" as const);
  return {
    value: `${score}/10`,
    status,
    evidenceType,
    confidence: Math.min(score * 10, 100),
    evidence: [{ day: "week", quote: note.slice(0, 200) }],
    notes: note,
  };
}

export function normalizeAnalysisOutput(
  compact: CompactAnalysis,
  clientName: string,
  weekLabel: string
): AnalysisOutput {
  return {
    clientName,
    weekLabel,
    overallStatus: compact.overallStatus,
    weeklyTrend: compact.weeklyTrend,
    coachAttentionRequired: compact.coachAttentionRequired,

    nutrition: {
      adherence: scoreToMetric(
        compact.nutrition.score,
        compact.nutrition.adherence
      ),
      proteinAdequacy: scoreToMetric(
        compact.nutrition.score,
        compact.nutrition.protein
      ),
      mealTiming: scoreToMetric(
        compact.nutrition.score,
        compact.nutrition.mealTiming
      ),
      skippedMeals: compact.nutrition.skippedMeals,
      keyFoods: compact.nutrition.keyFoods,
    },

    exercise: {
      averageSteps: compact.exercise.avgSteps,
      activitiesMentioned: compact.exercise.activities,
      exerciseSessions: compact.exercise.sessions,
      summary: scoreToMetric(compact.exercise.score, compact.exercise.note),
    },

    sleep: {
      averageHours: compact.sleep.avgHours,
      trend: compact.sleep.trend,
      summary: scoreToMetric(compact.sleep.score, compact.sleep.note),
    },

    water: {
      averageLitres: compact.water.avgLitres,
      summary: scoreToMetric(compact.water.score, compact.water.note),
    },

    symptoms: compact.symptoms.map((s) => ({
      name: s.name,
      severity: s.severity,
      firstSeen: s.firstSeen,
      latestMention: s.latestMention,
      evidenceType: s.evidenceType,
      evidence: [{ day: "week", quote: s.quote.slice(0, 200) }],
    })),

    stress: {
      level: compact.stress.level,
      reasons: compact.stress.reasons,
      summary: scoreToMetric(compact.stress.score, compact.stress.note),
    },

    engagement: {
      messagesSent: compact.engagement.messagesSent,
      coachReplies: compact.engagement.coachReplies,
      missedCalls: compact.engagement.missedCalls,
      consistencyRating: compact.engagement.rating,
      summary: scoreToMetric(compact.engagement.score, compact.engagement.note),
    },

    keyBarriers: compact.barriers,
    pendingActions: compact.pendingActions,
    riskFlags: compact.riskFlags,
    riskLevel: compact.riskLevel,
    recommendedNextActions: compact.recommendations,

    hallucination_guard: {
      unsupportedClaims: [],
      lowConfidenceFindings: compact.barriers,
    },
  };
}
