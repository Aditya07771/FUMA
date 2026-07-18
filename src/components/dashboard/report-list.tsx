"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Report {
  id: string;
  analysisId: string;
  clientName: string;
  weekLabel: string;
  status: string;
  approvedAt: Date | null;
  createdAt: Date;
}

interface ReportListProps {
  reports: Report[];
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-800",
  EDITED:   "bg-blue-100 text-blue-800",
  PENDING:  "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
};

const FILTERS = ["ALL", "APPROVED", "PENDING", "EDITED", "REJECTED"];

export function ReportList({ reports }: ReportListProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filtered = reports.filter((r) => {
    const matchesStatus = activeFilter === "ALL" || r.status === activeFilter;
    const matchesSearch = r.clientName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent reports</CardTitle>

        {/* Search */}
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap mt-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors
                ${activeFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground"}`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {reports.length === 0 ? "No reports yet — upload your first conversation." : "No reports match the current filter."}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{report.clientName}</span>
                    <Badge className={`text-[11px] ${STATUS_COLORS[report.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {report.weekLabel} · {formatDate(report.createdAt)}
                  </p>
                </div>
                <Link href={`/analysis/${report.analysisId}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs ml-2 shrink-0">
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}