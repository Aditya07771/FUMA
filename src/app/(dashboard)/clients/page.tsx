import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

const RISK_COLORS: Record<string, string> = {
  high:   "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low:    "bg-green-100 text-green-800",
};

export default async function ClientsPage() {
  const session = await auth();

  const analyses = await db.analysis.findMany({
    where: { userId: session!.user!.id, status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      clientName: true,
      weekLabel: true,
      llmOutputRaw: true,
      createdAt: true,
    },
  });

  // Group by client name
  const clientMap = new Map<string, typeof analyses>();
  for (const a of analyses) {
    const list = clientMap.get(a.clientName) ?? [];
    list.push(a);
    clientMap.set(a.clientName, list);
  }

  const clients = Array.from(clientMap.entries()).map(([name, sessions]) => {
    let riskLevel = "low";
    try {
      const parsed = JSON.parse(sessions[0].llmOutputRaw);
      riskLevel = parsed?.riskLevel ?? "low";
    } catch { /* ignore */ }

    return {
      name,
      sessions: sessions.length,
      latestId: sessions[0].id,
      latestWeek: sessions[0].weekLabel,
      latestDate: sessions[0].createdAt,
      riskLevel,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Clients</h1>
        <p className="text-muted-foreground">All clients with completed analyses.</p>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No clients yet. Upload your first conversation to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Card key={c.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">{c.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.sessions} session{c.sessions !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Badge className={`text-[11px] shrink-0 ${RISK_COLORS[c.riskLevel] ?? ""}`}>
                    {c.riskLevel} risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-3">
                  Latest: {c.latestWeek} · {formatDate(c.latestDate)}
                </p>
                <Link href={`/analysis/${c.latestId}`}>
                  <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                    View latest <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
