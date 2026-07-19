"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";

export function ConversationUpload() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [clientName, setClientName] = useState("");
  const [weekLabel, setWeekLabel] = useState("");
  const [conversation, setConversation] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["txt", "pdf", "docx"];

    if (!ext || !allowed.includes(ext)) {
      toast.error("Only .txt, .pdf, and .docx files are supported");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setIsExtracting(true);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Extraction failed");

      setConversation(data.text);
      toast.success(`Loaded ${file.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read file");
      setUploadedFileName("");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearFile = () => {
    setUploadedFileName("");
    setConversation("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, weekLabel, conversation }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Analysis failed");
      }

      const data = await res.json();
      router.push(`/analysis/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Client name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Sarah Johnson"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weekLabel">Week</Label>
              <Input
                id="weekLabel"
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="Week 1"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* File upload */}
          <div className="space-y-1.5">
            <Label>Upload file <span className="text-muted-foreground text-xs font-normal">(.txt · .pdf · .docx)</span></Label>
            {!uploadedFileName ? (
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${isExtracting ? "border-muted bg-muted/30" : "border-border hover:border-primary hover:bg-accent/30"}`}
              >
                {isExtracting ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Extracting text…
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                    <Upload className="h-5 w-5" />
                    <span>Click to upload or drag & drop</span>
                    <span className="text-xs">.txt, .pdf, .docx</span>
                  </div>
                )}
                <input
                  id="file-upload"
                  ref={fileRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={handleFileChange}
                  disabled={isLoading || isExtracting}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-accent/50 border rounded-lg text-sm">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 truncate">{uploadedFileName}</span>
                <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Conversation textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="conversation">
              Conversation{uploadedFileName ? " (extracted)" : ""}
            </Label>
            <Textarea
              id="conversation"
              value={conversation}
              onChange={(e) => setConversation(e.target.value)}
              placeholder="Or paste the conversation directly here…"
              className="min-h-[160px] font-mono text-xs"
              required
              disabled={isLoading || isExtracting}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading || isExtracting} className="w-full">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing…</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Analyse conversation</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}