"use client";

import { useEffect, useState } from "react";

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchPassage } from "@/lib/api";
import type { BiblePassageText } from "@/types/bible";

type PassageModalProps = {
  reference: string;
  /** Whether the containing Dialog is open (drives the fetch). */
  open: boolean;
};

/**
 * Dialog body for a single passage. Fetches text lazily when opened. Always
 * shows a read-in-context reminder and, when available, a "read full chapter"
 * link — even in the mock provider, where the verse text is a placeholder.
 */
export function PassageModal({ reference, open }: PassageModalProps) {
  const [data, setData] = useState<BiblePassageText | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchPassage(reference)
      .then((d) => active && setData(d))
      .catch(() => active && setError("Could not load this passage right now."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, reference]);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">{reference}</DialogTitle>
        <DialogDescription>
          {data?.translation
            ? `Translation: ${data.translation}`
            : "A passage to read slowly and prayerfully."}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-24">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading passage…</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {data && (
          <blockquote className="border-l-2 border-primary/40 pl-4 text-[0.975rem] leading-relaxed text-foreground/90">
            {data.text}
          </blockquote>
        )}
      </div>

      {data?.chapterUrl && (
        <a
          href={data.chapterUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Read the full chapter in context &rarr;
        </a>
      )}

      <p className="mt-1 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        A gentle reminder: passages are best understood in their surrounding
        context. Try reading the verses before and after this one, and let it
        guide reflection and prayer rather than serve as a single answer.
      </p>
    </DialogContent>
  );
}
