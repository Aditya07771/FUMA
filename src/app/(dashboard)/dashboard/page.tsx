import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { ReportList } from "@/components/dashboard/report-list";
import { ConversationUpload } from "@/components/analysis/conversation-upload";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  // Fetch stats
  const analyses = await db.analysis.findMany({
    where: { userId },
  });

  const reports = await db.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      analysisId: true, // ← required for correct View link
      clientName: true,
      weekLabel: true,
      status: true,
      approvedAt: true,
      createdAt: true,
    },
  });

  const approvedCount = reports.filter(
    (r: (typeof reports)[number]) => r.status === "APPROVED"
  ).length;
  const pendingCount = reports.filter(
    (r: (typeof reports)[number]) => r.status === "PENDING"
  ).length;

  // Count high-risk clients by parsing LLM output
  const highRiskCount = analyses.reduce((acc, a) => {
    try {
      const parsed = JSON.parse(a.llmOutputRaw);
      return parsed?.riskLevel === "high" ? acc + 1 : acc;
    } catch {
      return acc;
    }
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your client intelligence overview.
        </p>
      </div>

      <StatsBar
        totalAnalyses={analyses.length}
        approvedReports={approvedCount}
        pendingReports={pendingCount}
        highRiskClients={highRiskCount}
      />

      <div className="grid lg:grid-cols-2 gap-8">
        <ConversationUpload />
        <ReportList reports={reports} />
      </div>
    </div>
  );
}