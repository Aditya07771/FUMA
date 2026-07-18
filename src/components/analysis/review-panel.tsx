"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Edit, XCircle, X } from "lucide-react";
import type { AnalysisOutput } from "@/types/analysis";

interface ReviewPanelProps {
  analysisId: string;
  output: AnalysisOutput;
  onSave?: () => void;
}

const STATUS_CLASSES: Record<string, string> = {
  good: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

function SectionRows({ data }: { data: Record<string, unknown> }) {
  const rows: { label: string; value: string }[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (val === null || val === undefined) continue;
    if (typeof val === "object" && !Array.isArray(val)) {
      const o = val as Record<string, unknown>;
      if ("value" in o && "status" in o) {
        rows.push({
          label: key.replace(/([A-Z])/g, " $1").trim(),
          value: String(o.value),
        });
      }
    } else if (Array.isArray(val)) {
      if (val.length > 0) rows.push({ label: key, value: val.join(", ") });
    } else {
      rows.push({ label: key.replace(/([A-Z])/g, " $1").trim(), value: String(val) });
    }
  }

  return (
    <dl className="space-y-1.5">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-start gap-2 text-sm">
          <dt className="w-36 shrink-0 text-muted-foreground capitalize">{label}</dt>
          <dd className="flex-1 font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReviewPanel({ analysisId, output, onSave = () => {} }: ReviewPanelProps) {
  const [sections, setSections] = useState<Record<string, unknown>>(output as Record<string, unknown>);
  const [coachNotes, setCoachNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [draftJson, setDraftJson] = useState<Record<string, string>>({});

  const SECTIONS = [
    { key: "nutrition", label: "Nutrition" },
    { key: "exercise", label: "Exercise" },
    { key: "sleep", label: "Sleep" },
    { key: "water", label: "Water" },
    { key: "stress", label: "Stress" },
    { key: "engagement", label: "Engagement" },
  ];

  const startEdit = (key: string) => {
    setDraftJson((prev) => ({
      ...prev,
      [key]: JSON.stringify(sections[key], null, 2),
    }));
    setEditMode((prev) => ({ ...prev, [key]: true }));
  };

  const cancelEdit = (key: string) => {
    setEditMode((prev) => ({ ...prev, [key]: false }));
  };

  const saveEdit = (key: string) => {
    try {
      const parsed = JSON.parse(draftJson[key]);
      setSections((prev) => ({ ...prev, [key]: parsed }));
      setEditMode((prev) => ({ ...prev, [key]: false }));
      toast.success(`${key} updated`);
    } catch {
      toast.error("Invalid JSON — fix the syntax and try again");
    }
  };

  const handleSave = async (status: "APPROVED" | "EDITED" | "REJECTED") => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, sections, coachNotes, status }),
      });
      if (response.ok) {
        toast.success("Report saved");
        onSave();
      } else {
        toast.error("Failed to save report");
      }
    } catch {
      toast.error("Failed to save report");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {SECTIONS.map(({ key, label }) => (
        <Card key={key}>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{label}</CardTitle>
            {!editMode[key] ? (
              <Button size="sm" variant="ghost" onClick={() => startEdit(key)}>
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => saveEdit(key)}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Apply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => cancelEdit(key)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {editMode[key] ? (
              <Textarea
                value={draftJson[key]}
                onChange={(e) => setDraftJson((prev) => ({ ...prev, [key]: e.target.value }))}
                className="font-mono text-xs min-h-[140px]"
              />
            ) : (
              <SectionRows data={(sections[key] as Record<string, unknown>) ?? {}} />
            )}
          </CardContent>
        </Card>
      ))}

      {/* Overall status summary */}
      <Card>
        <CardContent className="pt-4 flex gap-2 flex-wrap">
          <Badge className={STATUS_CLASSES[String(sections.overallStatus)] ?? ""}>
            {String(sections.overallStatus)}
          </Badge>
          <Badge className={STATUS_CLASSES[String(sections.riskLevel)] ?? ""}>
            Risk: {String(sections.riskLevel)}
          </Badge>
        </CardContent>
      </Card>

      {/* Coach notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Coach notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            placeholder="Add your observations or concerns…"
            className="min-h-[90px]"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => handleSave("APPROVED")} disabled={isSaving} className="flex-1">
          <CheckCircle className="h-4 w-4 mr-2" /> Approve & save
        </Button>
        <Button onClick={() => handleSave("EDITED")} disabled={isSaving} variant="outline" className="flex-1">
          <Edit className="h-4 w-4 mr-2" /> Save as edited
        </Button>
        <Button onClick={() => handleSave("REJECTED")} disabled={isSaving} variant="destructive" className="flex-1">
          <XCircle className="h-4 w-4 mr-2" /> Reject
        </Button>
      </div>
    </div>
  );
}
