import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Brain,
  FileCheck,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  ChevronRight,
  MessageSquareQuote,
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-6 flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-lg font-bold tracking-tight">
            FUME
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#trust" className="hover:text-foreground transition-colors">
              AI Safety
            </a>
            <a href="https://github.com/Aditya07771/FUMA" className="hover:text-foreground transition-colors">
              Docs
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Link href="/dashboard">
                <Button size="sm">
                  Dashboard <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium text-muted-foreground mb-6">
          <Sparkles className="h-3 w-3" /> GenAI Client Intelligence Platform
        </span>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-5">
          AI-powered insights for
          <br />
          <span className="text-primary">health coaches</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Upload a client conversation. Get instant structured health metrics, grounded evidence,
          and trust labels — reviewed by you before saving.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          {session?.user ? (
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">Sign in</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mini proof strip */}
        <div className="mt-14 flex items-center justify-center gap-8 flex-wrap text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-green-500" /> Hallucination detection built-in
          </span>
          <span className="flex items-center gap-1.5">
            <FileCheck className="h-4 w-4 text-blue-500" /> Evidence grounded to source text
          </span>
          <span className="flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-purple-500" /> Human review before every save
          </span>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three steps from raw conversation to a reviewed, structured health report.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <MessageSquareQuote className="h-6 w-6 text-primary" />,
                title: "Upload a conversation",
                desc: "Paste text or upload a .txt, .pdf, or .docx file from your client check-in.",
              },
              {
                step: "02",
                icon: <Brain className="h-6 w-6 text-primary" />,
                title: "AI extracts & grounds",
                desc: "Our LLM agent extracts 10+ health metrics and links each one to exact quotes with confidence scores.",
              },
              {
                step: "03",
                icon: <UserCheck className="h-6 w-6 text-primary" />,
                title: "You review & save",
                desc: "Approve, edit per-section, or reject. The final report is always coach-controlled.",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-background border rounded-xl p-6 relative">
                <span className="absolute top-4 right-5 text-4xl font-black text-muted/40 select-none">
                  {step}
                </span>
                <div className="mb-3">{icon}</div>
                <h3 className="font-semibold text-base mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Built for trust</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every feature is designed around responsible AI — so coaches can trust the output.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <FileCheck className="h-8 w-8 text-blue-500" />,
                title: "Evidence grounding",
                desc: "Every metric is linked to the exact sentence in the conversation it was derived from — no floating claims.",
              },
              {
                icon: <ShieldCheck className="h-8 w-8 text-green-500" />,
                title: "Hallucination inspector",
                desc: "An automated QA agent flags unsupported claims and low-confidence findings before they reach the coach.",
              },
              {
                icon: <BarChart3 className="h-8 w-8 text-purple-500" />,
                title: "AI Trust Labels",
                desc: "Every metric is tagged: Confirmed Fact, Client Report, AI Inference, or Unavailable — so you know exactly what to trust.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="border rounded-xl p-6">
                <div className="mb-4">{icon}</div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SAFETY CALLOUT ────────────────────────────────────── */}
      <section id="trust" className="border-t bg-muted/30 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck className="h-10 w-10 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">AI safety is not an afterthought</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
            FUME runs a second-pass hallucination guard on every analysis. Claims that lack
            direct evidence from the conversation are flagged automatically. Coaches see a
            clear QA summary before approving any report.
          </p>
          {!session?.user && (
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Try it now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        FUME © 2025 · Built for GenAI Product Internship Assignment
      </footer>
    </div>
  );
}