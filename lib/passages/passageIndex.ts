import { passages, passagesByReference } from "@/data/passages";
import type { PassageSuggestion } from "@/types/bible";

/**
 * Thin accessor layer over the curated passage corpus. Keeping access behind
 * these helpers means the rest of the app never imports `data/passages`
 * directly, so the corpus could later be swapped for a DB/vector index without
 * touching callers.
 */

export function getAllPassages(): PassageSuggestion[] {
  return passages;
}

/** Look up a curated passage by its reference string (case-insensitive). */
export function findPassageByReference(
  reference: string,
): PassageSuggestion | undefined {
  return passagesByReference.get(reference.trim().toLowerCase());
}
