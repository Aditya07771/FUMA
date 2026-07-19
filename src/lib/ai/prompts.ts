export const PROMPT_VERSION = "v3.0-explicit";

/**
 * System prompt kept short — the heavy lifting is in the user prompt template.
 */
export const SYSTEM_PROMPT = `You are a health data analyst. You MUST return ONLY a single valid JSON object. No markdown. No code fences. No explanation. Start with { and end with }.`.trim();

/**
 * Build a user prompt that includes the COMPLETE JSON skeleton.
 * Llama 3.3 fills in values far more reliably when given the exact structure
 * than when asked to infer a schema from documentation.
 */
export function buildUserPrompt(
  conversation: string,
  clientName: string,
  weekLabel: string
): string {
  return `
Client: ${clientName}
Week: ${weekLabel}

Conversation:
${conversation}

---

Fill in every field in this JSON object using ONLY facts from the conversation above.
Return ONLY this JSON object. Replace every <...> placeholder with a real value.
Do NOT add extra keys. Do NOT remove any keys. Do NOT use markdown or code fences.

{
  "overallStatus": "<good|moderate|poor>",
  "weeklyTrend": "<improving|stable|declining>",
  "coachAttentionRequired": <true|false>,

  "nutrition": {
    "score": <0-10>,
    "adherence": "<one sentence>",
    "protein": "<one sentence>",
    "mealTiming": "<one sentence>",
    "skippedMeals": <integer>,
    "keyFoods": ["<food1>", "<food2>"]
  },

  "exercise": {
    "score": <0-10>,
    "avgSteps": <integer>,
    "activities": ["<activity1>"],
    "sessions": <integer>,
    "note": "<one sentence>"
  },

  "sleep": {
    "score": <0-10>,
    "avgHours": <decimal>,
    "trend": "<improving|stable|declining>",
    "note": "<one sentence>"
  },

  "water": {
    "score": <0-10>,
    "avgLitres": <decimal>,
    "note": "<one sentence>"
  },

  "symptoms": [
    {
      "name": "<symptom name>",
      "severity": "<mild|moderate|severe>",
      "firstSeen": "<day or date>",
      "latestMention": "<day or date>",
      "evidenceType": "<confirmed_fact|client_report|ai_inference|unavailable>",
      "quote": "<exact quote from conversation>"
    }
  ],

  "stress": {
    "score": <0-10>,
    "level": "<low|moderate|high>",
    "reasons": ["<reason1>"],
    "note": "<one sentence>"
  },

  "engagement": {
    "score": <0-10>,
    "messagesSent": <integer>,
    "coachReplies": <integer>,
    "missedCalls": <integer>,
    "rating": "<excellent|good|moderate|poor>",
    "note": "<one sentence>"
  },

  "barriers": ["<barrier1>"],

  "pendingActions": [
    {
      "action": "<action description>",
      "owner": "<client|coach>",
      "priority": "<high|medium|low>"
    }
  ],

  "riskFlags": [
    {
      "flag": "<flag title>",
      "reason": "<explanation>",
      "evidenceType": "<confirmed_fact|client_report|ai_inference|unavailable>"
    }
  ],

  "riskLevel": "<low|medium|high>",
  "recommendations": ["<recommendation1>"]
}

IMPORTANT RULES:
- "symptoms", "pendingActions", "riskFlags" MUST be arrays of OBJECTS as shown above — never plain strings.
- If no symptoms exist, use: "symptoms": []
- If no risk flags exist, use: "riskFlags": []
- If no pending actions exist, use: "pendingActions": []
- "overallStatus", "weeklyTrend", "riskLevel" must be exactly one of the enum values shown.
- "coachAttentionRequired" must be true or false (no quotes).
- All numeric fields must be numbers, not strings.
`.trim();
}