/**
 * coerce.ts
 *
 * Defensively fixes common Llama 3.3 JSON shape errors BEFORE Zod validation.
 *
 * Llama reliably gets wrong:
 *  1. symptoms / pendingActions / riskFlags as string[] instead of object[]
 *  2. Numeric fields returned as strings ("8" instead of 8)
 *  3. Boolean fields returned as strings ("true" instead of true)
 *  4. Missing top-level fields (null / undefined instead of defaults)
 *  5. Enum values with wrong casing ("Good" instead of "good")
 *
 * This runs AFTER JSON.parse() and BEFORE compactAnalysisSchema.parse().
 */

type AnyObj = Record<string, unknown>;

// ── helpers ──────────────────────────────────────────────────────

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

function toBool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1) return true;
  if (v === "false" || v === 0) return false;
  return fallback;
}

function lower(v: unknown): string {
  return typeof v === "string" ? v.toLowerCase().trim() : "";
}

function pickEnum<T extends string>(
  v: unknown,
  options: T[],
  fallback: T
): T {
  const s = lower(v) as T;
  return options.includes(s) ? s : fallback;
}

/**
 * Coerce an array that may contain plain strings into objects with a given shape.
 * If an element is already an object, it passes through unchanged.
 */
function coerceObjectArray<T>(
  arr: unknown,
  fromString: (s: string) => T,
  fallback: T[] = []
): T[] {
  if (!Array.isArray(arr)) return fallback;
  return arr.map((item) => {
    if (item && typeof item === "object") return item as T;
    if (typeof item === "string") return fromString(item);
    return null;
  }).filter(Boolean) as T[];
}

function sliceMax<T>(arr: T[], max: number): T[] {
  return Array.isArray(arr) ? arr.slice(0, max) : [];
}

// ── per-field coercers ────────────────────────────────────────────

function coerceNutrition(n: unknown): AnyObj {
  const obj = (n && typeof n === "object" ? n : {}) as AnyObj;
  return {
    score: toNum(obj.score, 5),
    adherence: String(obj.adherence ?? "not discussed"),
    protein: String(obj.protein ?? "not discussed"),
    mealTiming: String(obj.mealTiming ?? "not discussed"),
    skippedMeals: toNum(obj.skippedMeals, 0),
    keyFoods: sliceMax(
      Array.isArray(obj.keyFoods)
        ? obj.keyFoods.map(String)
        : [],
      10
    ),
  };
}

function coerceExercise(e: unknown): AnyObj {
  const obj = (e && typeof e === "object" ? e : {}) as AnyObj;
  return {
    score: toNum(obj.score, 5),
    avgSteps: toNum(obj.avgSteps, 0),
    activities: sliceMax(
      Array.isArray(obj.activities) ? obj.activities.map(String) : [],
      10
    ),
    sessions: toNum(obj.sessions, 0),
    note: String(obj.note ?? "not discussed"),
  };
}

function coerceSleep(s: unknown): AnyObj {
  const obj = (s && typeof s === "object" ? s : {}) as AnyObj;
  return {
    score: toNum(obj.score, 5),
    avgHours: toNum(obj.avgHours, 0),
    trend: pickEnum(obj.trend, ["improving", "stable", "declining"], "stable"),
    note: String(obj.note ?? "not discussed"),
  };
}

function coerceWater(w: unknown): AnyObj {
  const obj = (w && typeof w === "object" ? w : {}) as AnyObj;
  return {
    score: toNum(obj.score, 5),
    avgLitres: toNum(obj.avgLitres, 0),
    note: String(obj.note ?? "not discussed"),
  };
}

function coerceSymptom(item: AnyObj): AnyObj {
  return {
    name: String(item.name ?? "unknown"),
    severity: pickEnum(item.severity, ["mild", "moderate", "severe"], "mild"),
    firstSeen: String(item.firstSeen ?? "unknown"),
    latestMention: String(item.latestMention ?? "unknown"),
    evidenceType: pickEnum(
      item.evidenceType,
      ["confirmed_fact", "client_report", "ai_inference", "unavailable"],
      "client_report"
    ),
    quote: String(item.quote ?? ""),
  };
}

function coerceStress(s: unknown): AnyObj {
  const obj = (s && typeof s === "object" ? s : {}) as AnyObj;
  return {
    score: toNum(obj.score, 5),
    level: pickEnum(obj.level, ["low", "moderate", "high"], "moderate"),
    reasons: sliceMax(
      Array.isArray(obj.reasons) ? obj.reasons.map(String) : [],
      3
    ),
    note: String(obj.note ?? "not discussed"),
  };
}

function coerceEngagement(e: unknown): AnyObj {
  const obj = (e && typeof e === "object" ? e : {}) as AnyObj;
  return {
    score: toNum(obj.score, 5),
    messagesSent: toNum(obj.messagesSent, 0),
    coachReplies: toNum(obj.coachReplies, 0),
    missedCalls: toNum(obj.missedCalls, 0),
    rating: pickEnum(
      obj.rating,
      ["excellent", "good", "moderate", "poor"],
      "moderate"
    ),
    note: String(obj.note ?? "not discussed"),
  };
}

function coercePendingAction(item: AnyObj): AnyObj {
  return {
    action: String(item.action ?? item.description ?? "follow up"),
    owner: pickEnum(item.owner, ["client", "coach"], "coach"),
    priority: pickEnum(item.priority, ["high", "medium", "low"], "medium"),
  };
}

function coerceRiskFlag(item: AnyObj): AnyObj {
  return {
    flag: String(item.flag ?? item.name ?? "risk identified"),
    reason: String(item.reason ?? item.description ?? ""),
    evidenceType: pickEnum(
      item.evidenceType,
      ["confirmed_fact", "client_report", "ai_inference", "unavailable"],
      "client_report"
    ),
  };
}

// ── main export ───────────────────────────────────────────────────

/**
 * Call this immediately after JSON.parse() and before compactAnalysisSchema.parse().
 * Returns a new object that is maximally Zod-compatible.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function coerceCompact(raw: any): AnyObj {
  return {
    overallStatus: pickEnum(
      raw.overallStatus,
      ["good", "moderate", "poor"],
      "moderate"
    ),
    weeklyTrend: pickEnum(
      raw.weeklyTrend,
      ["improving", "stable", "declining"],
      "stable"
    ),
    coachAttentionRequired: toBool(raw.coachAttentionRequired, false),

    nutrition: coerceNutrition(raw.nutrition),
    exercise: coerceExercise(raw.exercise),
    sleep: coerceSleep(raw.sleep),
    water: coerceWater(raw.water),

    symptoms: sliceMax(
      coerceObjectArray(
        raw.symptoms,
        (s) => coerceSymptom({ name: s } as AnyObj),
        []
      ).map((item) => coerceSymptom(item as AnyObj)),
      5
    ),

    stress: coerceStress(raw.stress),
    engagement: coerceEngagement(raw.engagement),

    barriers: sliceMax(
      Array.isArray(raw.barriers) ? raw.barriers.map(String) : [],
      5
    ),

    pendingActions: sliceMax(
      coerceObjectArray(
        raw.pendingActions,
        (s) => ({ action: s, owner: "coach", priority: "medium" }),
        []
      ).map((item) => coercePendingAction(item as AnyObj)),
      8
    ),

    riskFlags: sliceMax(
      coerceObjectArray(
        raw.riskFlags,
        (s) => ({
          flag: s,
          reason: "",
          evidenceType: "client_report",
        }),
        []
      ).map((item) => coerceRiskFlag(item as AnyObj)),
      5
    ),

    riskLevel: pickEnum(
      raw.riskLevel,
      ["low", "medium", "high"],
      "low"
    ),

    recommendations: sliceMax(
      Array.isArray(raw.recommendations)
        ? raw.recommendations.map(String)
        : [],
      5
    ),
  };
}