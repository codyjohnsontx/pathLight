/**
 * Types for the curated passage index and the Bible-text provider layer.
 *
 * The curated index (`data/passages.ts`) is the source of truth for which
 * passages the app may ever surface. The AI is only allowed to explain
 * passages that came out of this index — it never invents references.
 */

/** A normalized reference to a span of verses within a single chapter. */
export type PassageRef = {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
};

/**
 * A curated passage entry. This is what the local search operates over.
 * Shape matches the product spec.
 */
export type PassageSuggestion = {
  id: string;
  /** Human-readable reference, e.g. "James 1:2-4". */
  reference: string;
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  /** Spiritual themes this passage speaks to (used for matching + grouping). */
  themes: string[];
  /** Emotional/life situations this passage may help with. */
  emotionalUseCases: string[];
  /** One-sentence, grounded summary of what the passage is about. */
  summary: string;
  /** Optional pastoral caution about misreading/misapplying the passage. */
  caution?: string;
};

/**
 * The actual passage text returned by a BibleProvider. In the MVP the mock
 * provider returns placeholder text; a real provider fills `text` with the
 * verses and, when possible, a link to read the full chapter in context.
 */
export type BiblePassageText = {
  reference: string;
  /** The verse text, or placeholder text in the mock provider. */
  text: string;
  /** Translation identifier, e.g. "MOCK", "WEB", "ESV". */
  translation: string;
  /** Optional URL to read the full chapter in context. */
  chapterUrl?: string;
  /** True when this is placeholder text rather than real scripture. */
  isPlaceholder: boolean;
};
