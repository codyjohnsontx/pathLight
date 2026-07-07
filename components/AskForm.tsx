"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AskFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

/** The main "ask a question" input: a calm textarea + submit button. */
export function AskForm({ value, onChange, onSubmit, loading }: AskFormProps) {
  const canSubmit = value.trim().length > 0 && !loading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="ask" className="sr-only">
        Describe what you&rsquo;re walking through
      </label>
      <Textarea
        id="ask"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter submits.
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
        }}
        placeholder="For example: I feel anxious about the future, and I'm not sure what to do next…"
        rows={4}
        className="min-h-28 resize-y rounded-xl border-border bg-card/70 text-base leading-relaxed shadow-sm focus-visible:ring-2"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Share as much or as little as you like.
        </p>
        <Button type="submit" disabled={!canSubmit} className="rounded-full px-6">
          {loading ? "Finding passages…" : "Find passages"}
        </Button>
      </div>
    </form>
  );
}
