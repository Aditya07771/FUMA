import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Count analyses with riskLevel "high" in their LLM output
  const allAnalyses = await db.analysis.findMany({
    where: { userId: session.user.id, status: "COMPLETE" },
    select: { llmOutputRaw: true },
  });

  let highRiskCount = 0;
  for (const a of allAnalyses) {
    try {
      const parsed = JSON.parse(a.llmOutputRaw);
      if (parsed?.riskLevel === "high") highRiskCount++;
    } catch {
      // skip unparseable rows
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={session.user} highRiskCount={highRiskCount} />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}