import type { BiblePassageText } from "@/types/bible";

/**
 * Provider abstraction for fetching actual Bible text.
 *
 * The app is intentionally not bound to one source. The MVP ships a mock
 * provider; a real provider (API.Bible, ESV API, YouVersion, …) can be added
 * later by implementing this interface and selecting it in `index.ts`.
 */

/** A resolved reference the provider is asked to fetch. */
export type PassageQuery = {
  /** Human-readable reference, e.g. "James 1:2-4". */
  reference: string;
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
};

export interface BibleProvider {
  /** Short identifier for logging/debugging, e.g. "mock", "api.bible". */
  readonly name: string;
  /** Fetch the passage text (and, when possible, a read-in-context link). */
  getPassage(query: PassageQuery): Promise<BiblePassageText>;
}

/**
 * Build a public "read the full chapter in context" URL. Uses Bible Gateway,
 * which needs no API key — so even the mock provider can offer a working
 * read-in-context link while the verse text itself is still a placeholder.
 */
export function chapterContextUrl(
  book: string,
  chapter: number,
  version = "WEB",
): string {
  const search = encodeURIComponent(`${book} ${chapter}`);
  return `https://www.biblegateway.com/passage/?search=${search}&version=${version}`;
}
