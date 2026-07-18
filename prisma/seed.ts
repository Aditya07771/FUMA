import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Demo user ─────────────────────────────────────────────────
  const demoEmail = process.env.DEMO_EMAIL ?? "demo@fume.ai";
  const demoPassword = process.env.DEMO_PASSWORD ?? "demo1234";

  const hashedPassword = await bcrypt.hash(demoPassword, 10);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      password: hashedPassword,
      isDemo: true,
    },
    create: {
      name: "Demo Coach",
      email: demoEmail,
      password: hashedPassword,
      isDemo: true,
    },
  });

  console.log(`✅ Demo user ready: ${demoUser.email}`);
  console.log(`   Password: ${demoPassword}`);

  // ── Seed a sample completed analysis ─────────────────────────
  const sampleOutput = {
    clientName: "Sample Client",
    weekLabel: "Week 1",
    overallStatus: "moderate",
    weeklyTrend: "improving",
    coachAttentionRequired: true,
    nutrition: {
      adherence: {
        value: "Moderate – meals logged most days",
        status: "moderate",
        evidenceType: "client_report",
        confidence: 75,
        evidence: [
          { day: "Day 1", quote: "Lunch was kadhi with soya and green vegetables." },
          { day: "Day 4", quote: "Breakfast was 1.5 vegetable chapatis with seeds and ajwain." },
        ],
        notes: "Meal quality good when eaten; skipping is the main issue",
      },
      proteinAdequacy: {
        value: "Low – protein missing on several days",
        status: "poor",
        evidenceType: "ai_inference",
        confidence: 80,
        evidence: [
          { day: "Day 5", quote: "Protein seems low in breakfast on some days." },
          { day: "Day 6", quote: "Food intake was low today. Protein was also missing." },
        ],
      },
      mealTiming: {
        value: "Irregular – school schedule disrupting routine",
        status: "moderate",
        evidenceType: "client_report",
        confidence: 70,
        evidence: [
          { day: "Day 3", quote: "I had to go to school after a few days. Very hectic morning." },
          { day: "Day 6", quote: "I am not getting enough time to plan meals." },
        ],
      },
      skippedMeals: 2,
      keyFoods: [
        "kadhi", "soya", "chapati", "coconut water", "roasted chana",
        "kala chana", "curd", "paneer", "prunes", "soaked nuts",
      ],
    },
    exercise: {
      averageSteps: 6625,
      activitiesMentioned: ["walking", "Surya Namaskar", "mopping", "sweeping", "stretching", "running"],
      exerciseSessions: 5,
      summary: {
        value: "Daily walking; additional exercise on most days",
        status: "good",
        evidenceType: "client_report",
        confidence: 90,
        evidence: [
          { day: "Day 1", quote: "Did some mopping, sweeping, Surya Namaskar and walking inside the house." },
          { day: "Day 4", quote: "Did around 20 minutes walking, stretching and breathing today." },
          { day: "Day 5", quote: "Did 20 minutes stretching and running." },
        ],
      },
    },
    sleep: {
      averageHours: 5.9,
      trend: "improving",
      summary: {
        value: "Average 5.9 hrs – improved to 8 hrs on Day 8",
        status: "poor",
        evidenceType: "confirmed_fact",
        confidence: 95,
        evidence: [
          { day: "Day 1", quote: "Slept only around 5 hours last night." },
          { day: "Day 8", quote: "Slept better last night, around 8 hours." },
        ],
      },
    },
    water: {
      averageLitres: 3.75,
      summary: {
        value: "Good – averaging 3.75L/day",
        status: "good",
        evidenceType: "confirmed_fact",
        confidence: 90,
        evidence: [
          { day: "Day 7", quote: "Water 4 litres" },
          { day: "Day 8", quote: "Water around 3.5 litres." },
        ],
      },
    },
    symptoms: [
      {
        name: "Acidity",
        severity: "moderate",
        firstSeen: "Day 1",
        latestMention: "Day 2",
        evidenceType: "client_report",
        evidence: [
          { day: "Day 1", quote: "Feeling some acidity since morning." },
          { day: "Day 2", quote: "Still having acidity and bloating." },
        ],
      },
      {
        name: "Bloating",
        severity: "moderate",
        firstSeen: "Day 2",
        latestMention: "Day 8",
        evidenceType: "client_report",
        evidence: [
          { day: "Day 6", quote: "Bloating is back and I feel like I have gained weight." },
          { day: "Day 8", quote: "Still having bloating on and off." },
        ],
      },
      {
        name: "Fatigue",
        severity: "severe",
        firstSeen: "Day 7",
        latestMention: "Day 7",
        evidenceType: "client_report",
        evidence: [
          { day: "Day 7", quote: "During a meeting today I was so tired that my head went down on the table." },
        ],
      },
    ],
    stress: {
      level: "high",
      reasons: ["office pressure", "work politics", "poor sleep", "hectic school schedule"],
      summary: {
        value: "High – persistent work stress with physical symptoms",
        status: "poor",
        evidenceType: "client_report",
        confidence: 92,
        evidence: [
          { day: "Day 7", quote: "There is a lot of office pressure and politics going on." },
          { day: "Day 7", quote: "Feeling very low." },
          { day: "Day 7", quote: "I feel I can sleep for days." },
        ],
      },
    },
    engagement: {
      messagesSent: 34,
      coachReplies: 16,
      missedCalls: 1,
      consistencyRating: "excellent",
      summary: {
        value: "Excellent – daily updates, responsive, one missed call",
        status: "good",
        evidenceType: "confirmed_fact",
        confidence: 95,
        evidence: [
          { day: "Day 7", quote: "Sorry I missed your call. There was a stressful situation at work." },
        ],
      },
    },
    keyBarriers: [
      "Inconsistent sleep (averaging under 6 hrs)",
      "High work stress affecting energy and meal planning",
      "School schedule disrupting morning routine",
      "Low protein intake on several days",
      "Persistent bloating affecting motivation",
    ],
    pendingActions: [
      { action: "Set ACV reminder around meal timings", owner: "client", priority: "medium" },
      { action: "Stock vegetables for daily salad", owner: "client", priority: "medium" },
      { action: "Review sleep hygiene plan", owner: "coach", priority: "high" },
      { action: "Increase breakfast protein (sprouts, boiled chana, moong)", owner: "client", priority: "high" },
      { action: "Schedule follow-up call to address stress", owner: "coach", priority: "high" },
    ],
    riskFlags: [
      {
        flag: "Extreme fatigue — fell asleep in meeting",
        reason: "Client reported head going down on the table during a meeting (Day 7)",
        evidenceType: "client_report",
      },
      {
        flag: "Chronic sleep deprivation",
        reason: "Sleeping under 6 hours on most days across the week",
        evidenceType: "confirmed_fact",
      },
      {
        flag: "High persistent stress",
        reason: "Office politics and pressure cited on multiple days; emotional exhaustion evident",
        evidenceType: "client_report",
      },
    ],
    riskLevel: "medium",
    recommendedNextActions: [
      "Schedule a call to address stress and burnout risk",
      "Review sleep hygiene — set a fixed bedtime target",
      "Build a simple weekly meal prep plan to improve protein consistency",
      "Continue hydration; positive habit to reinforce",
      "Introduce a short end-of-day wind-down routine",
    ],
    hallucination_guard: {
      unsupportedClaims: [
        "No blood pressure or clinical measurements were mentioned — not reported",
        "No mention of supplements beyond seeds and nuts",
      ],
      lowConfidenceFindings: [
        "Exact step counts were only mentioned on Day 4 (4,500) and Day 7 (6,000); average is an estimate",
        "Water intake on Days 1-6 not explicitly stated; Days 7-8 figures used for average",
      ],
    },
  };

  const sampleAnalysis = await prisma.analysis.upsert({
    where: { id: "seed-analysis-001" },
    update: {},
    create: {
      id: "seed-analysis-001",
      userId: demoUser.id,
      clientName: "Sample Client",
      weekLabel: "Week 1",
      rawConversation: `Day 1
Client: Good morning. Slept only around 5 hours last night. Daughter had exams, so I was awake late.
Client: Did some mopping, sweeping, Surya Namaskar and walking inside the house.
Coach: Good. Please keep sharing your daily updates for water, sleep, steps, exercise and meals.
Client: Lunch was kadhi with soya and green vegetables.
Client: Feeling some acidity since morning.

Day 7
Client: Steps 6,000 today.
Client: Sleep around 5.5 hours.
Client: During a meeting today I was so tired that my head went down on the table and I actually slept for a few seconds.
Client: Feeling very low.
Client: There is a lot of office pressure and politics going on.

Day 8
Client: Slept better last night, around 8 hours.
Client: Energy feels much better today.
Client: Water around 3.5 litres.
Client: Did 30 minutes exercise.
Client: Still having bloating on and off.`,
      llmProvider: "gemini",
      promptVersion: "v1.0",
      llmOutputRaw: JSON.stringify(sampleOutput),
      status: "COMPLETE",
      tokensUsed: 3200,
      latencyMs: 4800,
    },
  });

  console.log(`✅ Sample analysis seeded: ${sampleAnalysis.id}`);

  // ── Seed a sample approved report ────────────────────────────
  await prisma.report.upsert({
    where: { analysisId: "seed-analysis-001" },
    update: {},
    create: {
      analysisId: sampleAnalysis.id,
      userId: demoUser.id,
      clientName: "Sample Client",
      weekLabel: "Week 1",
      status: "APPROVED",
      sections: sampleOutput,
      coachNotes:
        "Client is highly engaged. Main concerns: sleep deprivation and work stress. Follow up call needed this week.",
      approvedAt: new Date(),
    },
  });

  console.log(`✅ Sample report seeded`);

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log(`Demo login → ${demoEmail} / ${demoPassword}`);
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });