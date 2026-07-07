# Pathlight

**Find Bible passages for what you're walking through.**

Pathlight is a Next.js + TypeScript app where you describe a life situation
("I'm discouraged in my job search…") and get back a few themed cards of
**curated** Bible passages — with short explanations, reflection questions, and
optional prayer prompts — plus a way to open each passage and read it in context.

It is a **study aid**, not a replacement for a pastor, counselor, church, or your
own reading of Scripture. It is built to be grounded and non-manipulative on
purpose (see [Guardrails](#guardrails)).

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

That's it — the app runs with **no configuration**, using a deterministic mock
AI and a mock Bible-text provider. Try "I'm discouraged in my job search." or one
of the example prompts.

> **Node version:** use Node **20.19+** (or 22 LTS) to silence engine warnings.
> The app builds and runs on 20.15, but the newest Prisma CLI needs 20.19+ — this
> project pins Prisma 5.22 so it installs on 20.15. Upgrading Node lets you move
> to the latest Prisma later.

---

## How it works

```
Home page (AskForm) ── POST /api/ask { question }
   │
   ├─ 1. Deterministic crisis scan (code) ── if hit ─▶ crisis-support response
   ├─ 2. classifyQuestion()  → { situation, emotionalState, spiritualThemes,
   │        searchKeywords, topicsToAvoid, crisisDetected }   (mock | Llama)
   ├─ 3. if crisisDetected ─▶ crisis-support response
   ├─ 4. searchPassages()   → top 8–12 curated passages, grouped into 3–5 themes
   └─ 5. generateGuidance() → opening message + themed cards   (mock | Llama)
             using ONLY the retrieved passages
   │
   ▼
Theme cards → click a reference → GET /api/passage?ref=… → Bible text (mock | API.Bible)
```

The **curated passage index** (`data/passages.ts`) is the only set of passages
the app can ever surface. Retrieval scoring is deterministic; the AI only ever
*explains* passages that retrieval already selected. References shown to the user
come from the curated data, not from the model.

---

## Guardrails

- **Never invents references.** The AI is constrained to the retrieved passages,
  and `generateGuidance` sanitizes model output — any reference not in the
  curated set is dropped, and canonical reference strings are used.
- **Crisis handling.** A deterministic keyword scan runs as **code** in
  `/api/ask` *before and independent of* the model. Self-harm / abuse / danger
  inputs return a gentle crisis-support response (real help lines), never verses.
  The classifier's `crisisDetected` is a second gate.
- **No promises, no "God is telling you…".** The generation system prompt forbids
  promised outcomes, claims of specific divine messages, and using verses as magic
  answers, and prefers "these passages may help you reflect on…" phrasing.
- **Read in context.** Every passage modal shows a read-in-context reminder and a
  "read the full chapter" link; a disclaimer is always visible.
- **Not professional advice.** No medical, legal, financial, or professional
  counseling — surfaced in the disclaimer and crisis copy.

---

## Configuration

Copy `.env.example` → `.env.local` (app config) and, if you use the database, set
`DATABASE_URL` in `.env`. All settings have safe defaults.

### Swap the mock AI for free Llama

Set these in `.env.local`. Any OpenAI-compatible endpoint works.

**Groq** (hosted, free tier, fast — recommended for a deployed app):

```bash
AI_PROVIDER=llama
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=gsk_your_groq_key           # from https://console.groq.com
AI_MODEL=llama-3.3-70b-versatile
```

**Ollama** (fully local, free — great for offline dev):

```bash
# ollama serve  &&  ollama pull llama3.1
AI_PROVIDER=llama
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama                       # value is ignored by Ollama
AI_MODEL=llama3.1
```

Both AI calls request JSON output and are validated with zod. If the model is
unreachable or returns unusable JSON, the app **automatically falls back to the
mock** so `/api/ask` never breaks. (No Anthropic SDK is used — this project
targets Llama per the chosen provider.)

### Swap the mock Bible text for API.Bible

```bash
BIBLE_PROVIDER=apibible
BIBLE_API_KEY=your_key                   # free at https://scripture.api.bible
BIBLE_ID=9879dbb7cfe39e4d-01             # a World English Bible edition (example)
```

`lib/bible/ApiBibleProvider.ts` is already implemented; the factory in
`lib/bible/index.ts` selects it when `BIBLE_PROVIDER=apibible`. To add another
provider (ESV API, YouVersion, …), implement the `BibleProvider` interface and
add a case to the factory.

### Database (post-MVP features)

The MVP does not use the database. The Prisma schema (`prisma/schema.prisma`)
models `User`, `SavedPassage`, `SavedReflection`, `Collection`, and
`CollectionItem` for later features (accounts, saving passages/reflections,
collections). To use it:

```bash
# set a real DATABASE_URL in .env, then:
npx prisma migrate dev --name init
```

`lib/db.ts` exports a lazy `prisma` singleton, so the app runs without a live
database until you wire these models into a feature.

---

## Project structure

```
app/
  page.tsx                 # home: hero, ask box, examples, results
  layout.tsx               # fonts + warm palette
  api/ask/route.ts         # classify → crisis gate → retrieve → generate
  api/passage/route.ts     # fetch passage text (curated refs only)
components/                 # AskForm, ThemeCard, PassageLink/Modal, CrisisNotice, …
  ui/                       # shadcn/ui primitives
lib/
  ai/                      # classifyQuestion, generateGuidance, mock, llamaClient, prompts, schemas
  bible/                   # BibleProvider interface, Mock + ApiBible, factory
  passages/                # passageIndex, searchPassages (scoring + grouping)
  db.ts                    # Prisma singleton (post-MVP)
data/
  passages.ts              # the curated passage index
  crisisResources.ts       # crisis keywords + support response
types/                     # bible.ts, guidance.ts
prisma/schema.prisma
```

---

## Roadmap (after the MVP)

Real API.Bible integration · user accounts · saved passages & reflections ·
collections · daily encouragement · shareable study cards · full-chapter context ·
translation selector · pastoral/church resource links. These layer onto the
Prisma schema and the provider interfaces already scaffolded here.
