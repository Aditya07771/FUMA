# FUME — GenAI Client Intelligence Platform

> AI-powered assistant that turns a client-coach conversation into a structured, evidence-grounded weekly health report — with human review before anything gets saved.

Built for the **FUME GenAI Product Intern** assignment.

---

## Demo

**Live app →** `https://fume-client-intelligence-ten.vercel.app/`

**Demo login →** `demo@fume.ai` / `demo1234`

---

## How it works

```
Upload conversation (text / .pdf / .docx)
        ↓
LLM extracts 10+ health metrics
(Gemini 2.5 Flash or Groq Llama 3.3)
        ↓
Every metric linked to an exact quote
from the original conversation
        ↓
Hallucination guard flags unsupported claims
        ↓
Coach reviews → Approve / Edit / Reject
        ↓
Report saved only after human sign-off
```

---

## Features

- **Weekly health summary** — nutrition, exercise, sleep, water, stress, symptoms, engagement, risk flags, pending actions
- **Evidence grounding** — every metric cites the exact day + quote it came from
- **AI Trust Labels** — `confirmed_fact` / `client_report` / `ai_inference` / `unavailable` on every finding
- **Confidence scores** — visual bar showing how certain the model is
- **Hallucination guard** — automated QA flags unsupported claims before the coach sees them
- **Human-in-the-loop** — section-by-section edit + approve / reject workflow
- **Dual LLM support** — Gemini 2.5 Flash or Groq Llama 3.3, switchable via one env var
- **File extraction** — upload .txt, .pdf, or .docx conversations directly

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| UI | Tailwind CSS, shadcn/ui |
| Auth | NextAuth.js (credentials + demo login) |
| Database | PostgreSQL via Supabase + Prisma ORM |
| AI | Gemini 2.5 Flash API / Groq Llama 3.3 70B |
| Validation | Zod (two-stage schema pipeline) |
| Deployment | Vercel |

---

## Getting started

```bash
# 1. Clone and install
git clone https://github.com/Aditya07771/fume-client-intelligence
cd fume-client-intelligence
npm install

# 2. Environment variables
cp .env.example .env.local
```

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Pick one
LLM_PROVIDER=gemini
GOOGLE_AI_API_KEY=

# or
LLM_PROVIDER=groq
GROQ_API_KEY=

# Optional
NEXT_PUBLIC_DEMO_EMAIL=demo@fume.ai
DEMO_PASSWORD=demo1234
```

```bash
# 3. Database setup
npx prisma migrate dev
npx prisma db seed

# 4. Run
npm run dev
```

---

## Switching LLM providers

```env
LLM_PROVIDER=gemini   # Gemini 2.5 Flash
LLM_PROVIDER=groq     # Llama 3.3 70B via Groq
```

No code changes needed — fully abstracted in `src/lib/ai/provider.ts`.

---

## Project structure

```
src/
├── app/
│   ├── (auth)/           # login, register
│   ├── (dashboard)/      # dashboard, clients, analysis/[id]
│   └── api/              # analysis, reports, extract, auth
├── components/
│   ├── analysis/         # upload, processing state, review panel
│   └── dashboard/        # stats bar, report list
└── lib/
    └── ai/               # provider, gemini, groq, prompts,
                          # schema, compactSchema, normalize, coerce
```

---

## AI pipeline

The LLM fills a **compact schema** (simpler, less room for error). The app normalizes it into the **full output schema** with metric blocks, confidence scores, and evidence arrays. This two-stage approach is what makes the system reliable across both Gemini and Llama.

Groq/Llama also gets a **defensive coercion layer** that auto-fixes common output errors (wrong types, bad enum casing, string arrays instead of object arrays) before Zod validation runs.
