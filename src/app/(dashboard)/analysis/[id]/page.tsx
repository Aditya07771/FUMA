import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { analysisOutputSchema } from "@/lib/ai/schema";
import { compactAnalysisSchema } from "@/lib/ai/compactSchema";
import { normalizeAnalysisOutput } from "@/lib/ai/normalize";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewPanel } from "@/components/analysis/review-panel";
import { ProcessingState } from "@/components/analysis/processing-state";
import { statusColor, evidenceTypeBadge } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MessageSquareQuote } from "lucide-react";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  // Try to find by analysis ID first, then by report ID (for backward compat
  // with the report-list bug where report.id was linked instead of analysisId)
  let analysis = await db.analysis.findFirst({
    where: { id, userId: session!.user!.id },
  });

  // Fallback: maybe the URL contains a report ID — look up the analysis via report
  if (!analysis) {
    const report = await db.report.findFirst({
      where: { id, userId: session!.user!.id },
      include: { analysis: true },
    });
    if (report) {
      analysis = report.analysis;
    }
  }

  if (!analysis) {
    notFound();
  }

  // Show a processing/failed state instead of 404
  if (analysis.status === "PROCESSING") {
    return <ProcessingState id={analysis.id} />;
  }

  if (analysis.status === "FAILED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-2xl font-semibold text-destructive">
          Analysis failed
        </div>
        <p className="text-muted-foreground">
          The AI could not process this conversation. Please try again.
        </p>
      </div>
    );
  }

  // Parse the stored LLM output — show an error card instead of 404 on failure
  let output = null;
  let parseError: string | null = null;

  try {
    if (!analysis.llmOutputRaw) {
      throw new Error("No LLM output stored");
    }
    const raw = JSON.parse(analysis.llmOutputRaw);
    
    // First try the new AnalysisOutput format
    const validated = analysisOutputSchema.safeParse(raw);
    if (validated.success) {
      output = validated.data;
    } else {
      // Fallback for older records stored in CompactAnalysis format
      const compactValidated = compactAnalysisSchema.safeParse(raw);
      if (compactValidated.success) {
        output = normalizeAnalysisOutput(compactValidated.data, analysis.clientName, analysis.weekLabel);
      } else {
        // Log validation errors but try to use the raw data anyway
        console.error("[analysis-page] Schema validation failed for", id);
        console.error(JSON.stringify(validated.error.flatten(), null, 2));
        // Attempt to use the raw parsed object directly as a fallback
        output = raw;
        parseError = "Some fields may be missing — schema validation failed.";
      }
    }
  } catch (err) {
    console.error("[analysis-page] JSON parse failed for", id, err);
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-2xl font-semibold text-destructive">
          Could not load analysis
        </div>
        <p className="text-muted-foreground">
          The stored output could not be parsed. Error: {String(err)}
        </p>
      </div>
    );
  }

  const statusBadgeColor = (status: string) => {
    const color = statusColor(status);
    const colors: Record<string, string> = {
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return colors[color] ?? colors.gray;
  };

  return (
    <div className="space-y-6">
      {parseError && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          ⚠ {parseError}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{output.clientName}</h1>
          <p className="text-muted-foreground">{output.weekLabel}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={statusBadgeColor(output.overallStatus)}>
            {output.overallStatus}
          </Badge>
          <Badge className={statusBadgeColor(output.riskLevel)}>
            Risk: {output.riskLevel}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="dev">Dev Info</TabsTrigger>
        </TabsList>

        {/* ── Summary Tab ─────────────────────────────────────── */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Nutrition Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nutrition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Adherence</p>
                  <p className="font-semibold">
                    {output.nutrition?.adherence?.value ?? "—"}
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {output.nutrition?.adherence?.status && (
                      <Badge className={statusBadgeColor(output.nutrition.adherence.status)}>
                        {output.nutrition.adherence.status}
                      </Badge>
                    )}
                    {output.nutrition?.adherence?.evidenceType && (
                      <TrustBadge type={output.nutrition.adherence.evidenceType} />
                    )}
                  </div>
                  {output.nutrition?.adherence?.confidence !== undefined && (
                    <ConfidenceBar value={output.nutrition.adherence.confidence} />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Skipped Meals</p>
                  <p className="font-semibold">
                    {output.nutrition?.skippedMeals ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exercise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Steps</p>
                  <p className="font-semibold">
                    {output.exercise?.averageSteps ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sessions</p>
                  <p className="font-semibold">
                    {output.exercise?.exerciseSessions ?? "—"}
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {output.exercise?.summary?.evidenceType && (
                      <TrustBadge type={output.exercise.summary.evidenceType} />
                    )}
                  </div>
                  {output.exercise?.summary?.confidence !== undefined && (
                    <ConfidenceBar value={output.exercise.summary.confidence} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sleep Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sleep</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Hours</p>
                  <p className="font-semibold">
                    {output.sleep?.averageHours ?? "—"} hrs
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {output.sleep?.summary?.status && (
                      <Badge className={statusBadgeColor(output.sleep.summary.status)}>
                        {output.sleep.trend}
                      </Badge>
                    )}
                    {output.sleep?.summary?.evidenceType && (
                      <TrustBadge type={output.sleep.summary.evidenceType} />
                    )}
                  </div>
                  {output.sleep?.summary?.confidence !== undefined && (
                    <ConfidenceBar value={output.sleep.summary.confidence} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Water Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Water</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Litres</p>
                  <p className="font-semibold">
                    {output.water?.averageLitres ?? "—"}L
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {output.water?.summary?.evidenceType && (
                      <TrustBadge type={output.water.summary.evidenceType} />
                    )}
                  </div>
                  {output.water?.summary?.confidence !== undefined && (
                    <ConfidenceBar value={output.water.summary.confidence} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Level</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {output.stress?.level && (
                      <Badge className={statusBadgeColor(output.stress.level)}>
                        {output.stress.level}
                      </Badge>
                    )}
                    {output.stress?.summary?.evidenceType && (
                      <TrustBadge type={output.stress.summary.evidenceType} />
                    )}
                  </div>
                  {output.stress?.summary?.confidence !== undefined && (
                    <ConfidenceBar value={output.stress.summary.confidence} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="font-semibold">
                    {output.engagement?.messagesSent ?? "—"}
                  </p>
                </div>
                <div>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {output.engagement?.consistencyRating && (
                      <Badge className={statusBadgeColor(output.engagement.consistencyRating)}>
                        {output.engagement.consistencyRating}
                      </Badge>
                    )}
                    {output.engagement?.summary?.evidenceType && (
                      <TrustBadge type={output.engagement.summary.evidenceType} />
                    )}
                  </div>
                  {output.engagement?.summary?.confidence !== undefined && (
                    <ConfidenceBar value={output.engagement.summary.confidence} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Barriers */}
          {output.keyBarriers?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Barriers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {output.keyBarriers.map((barrier: string, i: number) => (
                    <li key={i} className="text-sm">
                      {barrier}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Pending Actions */}
          {output.pendingActions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {output.pendingActions.map(
                    (
                      action: { priority: string; action: string; owner: string },
                      i: number
                    ) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Badge variant="outline">{action.priority}</Badge>
                        <span className="flex-1">{action.action}</span>
                        <span className="text-muted-foreground">
                          {action.owner}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Flags */}
          {output.riskFlags?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Risk Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {output.riskFlags.map(
                    (
                      risk: { flag: string; reason: string },
                      i: number
                    ) => (
                      <div
                        key={i}
                        className="border-l-4 border-red-500 pl-4"
                      >
                        <p className="font-semibold">{risk.flag}</p>
                        <p className="text-sm text-muted-foreground">
                          {risk.reason}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Hallucination & QA Check ──────────────────────── */}
          <HallucinationCard guard={output.hallucination_guard} />
        </TabsContent>

        {/* ── Evidence Tab ────────────────────────────────────── */}
        <TabsContent value="evidence" className="space-y-4">
          {/* Nutrition */}
          <Card>
            <CardHeader><CardTitle>Nutrition evidence</CardTitle></CardHeader>
            <CardContent>
              <EvidenceList items={output.nutrition?.adherence?.evidence} />
            </CardContent>
          </Card>

          {/* Exercise */}
          <Card>
            <CardHeader><CardTitle>Exercise evidence</CardTitle></CardHeader>
            <CardContent>
              <EvidenceList items={output.exercise?.summary?.evidence} />
            </CardContent>
          </Card>

          {/* Sleep */}
          <Card>
            <CardHeader><CardTitle>Sleep evidence</CardTitle></CardHeader>
            <CardContent>
              <EvidenceList items={output.sleep?.summary?.evidence} />
            </CardContent>
          </Card>

          {/* Stress */}
          <Card>
            <CardHeader><CardTitle>Stress evidence</CardTitle></CardHeader>
            <CardContent>
              <EvidenceList items={output.stress?.summary?.evidence} />
            </CardContent>
          </Card>

          {/* Engagement */}
          <Card>
            <CardHeader><CardTitle>Engagement evidence</CardTitle></CardHeader>
            <CardContent>
              <EvidenceList items={output.engagement?.summary?.evidence} />
            </CardContent>
          </Card>

          {/* Symptoms */}
          {output.symptoms?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Symptom evidence</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {output.symptoms.map((s: { name: string; evidence: { day: string; quote: string }[] }, i: number) => (
                  <div key={i}>
                    <p className="font-medium text-sm mb-1">{s.name}</p>
                    <EvidenceList items={s.evidence} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Review Tab ──────────────────────────────────────── */}
        <TabsContent value="review">
          <ReviewPanel
            analysisId={analysis.id}
            output={output}
          />
        </TabsContent>

        {/* ── Dev Info Tab ────────────────────────────────────── */}
        <TabsContent value="dev">
          <Card>
            <CardHeader>
              <CardTitle>Development Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Analysis ID:</dt>
                  <dd className="font-mono">{analysis.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">LLM Provider:</dt>
                  <dd>{analysis.llmProvider}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Prompt Version:</dt>
                  <dd>{analysis.promptVersion}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tokens Used:</dt>
                  <dd>{analysis.tokensUsed ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Latency:</dt>
                  <dd>{analysis.latencyMs ? `${analysis.latencyMs}ms` : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status:</dt>
                  <dd>{analysis.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created:</dt>
                  <dd>{new Date(analysis.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Helper: AI Trust Label badge ─────────────────────────────────────────────
function TrustBadge({ type }: { type: string }) {
  const { label, color } = evidenceTypeBadge(type);
  return <Badge className={`text-[11px] ${color}`}>{label}</Badge>;
}

// ── Helper: Confidence bar ───────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 75 ? "bg-green-500" : pct >= 45 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
        <span>Confidence</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Helper: Hallucination guard card ────────────────────────────────────────
function HallucinationCard({
  guard,
}: {
  guard?: { unsupportedClaims?: string[]; lowConfidenceFindings?: string[] };
}) {
  const unsupported = guard?.unsupportedClaims ?? [];
  const lowConf = guard?.lowConfidenceFindings ?? [];
  const hasIssues = unsupported.length > 0 || lowConf.length > 0;

  return (
    <Card className={hasIssues ? "border-amber-300" : "border-green-300"}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {hasIssues ? (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          )}
          <CardTitle className="text-base">Hallucination &amp; QA Check</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!hasIssues ? (
          <p className="text-sm text-green-700 font-medium">
            ✓ No hallucinations detected by QA agent.
          </p>
        ) : (
          <div className="space-y-4">
            {unsupported.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1.5">
                  Unsupported claims
                </p>
                <ul className="space-y-1">
                  {unsupported.map((claim, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                      {claim}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lowConf.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-1.5">
                  Low-confidence findings
                </p>
                <ul className="space-y-1">
                  {lowConf.map((finding, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-orange-800">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-orange-500" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Helper: Evidence chat-bubble list ───────────────────────────────────────
function EvidenceList({ items }: { items?: { day: string; quote: string }[] }) {
  if (!items?.length) {
    return <p className="text-sm text-muted-foreground">No evidence quotes available.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="group relative bg-accent/40 border border-border rounded-xl px-4 py-3 text-sm"
        >
          {/* Quote icon */}
          <MessageSquareQuote className="absolute -top-2 -left-2 h-4 w-4 text-primary bg-background rounded-full p-0.5 ring-1 ring-border" />
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {item.day}
          </p>
          <p className="leading-relaxed text-foreground italic">&ldquo;{item.quote}&rdquo;</p>
        </div>
      ))}
    </div>
  );
}