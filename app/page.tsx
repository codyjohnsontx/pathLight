"use client";

import { useState } from "react";

import { AskForm } from "@/components/AskForm";
import { CrisisNotice } from "@/components/CrisisNotice";
import { DisclaimerNote } from "@/components/DisclaimerNote";
import { ExamplePrompts } from "@/components/ExamplePrompts";
import { ThemeCard } from "@/components/ThemeCard";
import { askQuestion } from "@/lib/api";
import type { AskResponse } from "@/types/guidance";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);

  async function handleSubmit() {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      setResponse(await askQuestion(q));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-20 pt-12 sm:pt-20">
      {/* Hero */}
      <header className="text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary/70">
          Pathlight
        </p>
        <h1 className="font-serif text-3xl font-medium leading-tight text-foreground sm:text-4xl">
          Find Bible passages for what you&rsquo;re walking through.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
          Describe a situation and Pathlight will suggest passages to reflect on,
          pray over, and study — never as magic answers, always to point you back
          to Scripture in context.
        </p>
      </header>

      {/* Ask box */}
      <section className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm sm:p-6">
        <AskForm
          value={question}
          onChange={setQuestion}
          onSubmit={handleSubmit}
          loading={loading}
        />
        <div className="mt-5 border-t border-border/50 pt-4">
          <ExamplePrompts onSelect={setQuestion} disabled={loading} />
        </div>
      </section>

      {/* Results */}
      <section className="mt-8" aria-live="polite">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && <LoadingState />}

        {!loading && response?.kind === "crisis" && (
          <CrisisNotice data={response} />
        )}

        {!loading && response?.kind === "guidance" && (
          <div className="space-y-6">
            <p className="text-[0.975rem] leading-relaxed text-foreground/85">
              {response.openingMessage}
            </p>
            <div className="space-y-5">
              {response.themes.map((theme, i) => (
                <ThemeCard key={`${theme.title}-${i}`} theme={theme} />
              ))}
            </div>
            <DisclaimerNote text={response.disclaimer} />
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-14 text-center text-xs text-muted-foreground">
        Pathlight is a study aid, not a replacement for a pastor, counselor,
        church, or your own reading of Scripture.
      </footer>
    </main>
  );
}

/** Simple pulsing placeholders while the request is in flight. */
function LoadingState() {
  return (
    <div className="space-y-5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border/60 bg-card/60 p-5"
        >
          <div className="h-5 w-2/3 rounded bg-muted" />
          <div className="mt-3 h-3 w-full rounded bg-muted/70" />
          <div className="mt-2 h-3 w-5/6 rounded bg-muted/70" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-6 w-24 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
