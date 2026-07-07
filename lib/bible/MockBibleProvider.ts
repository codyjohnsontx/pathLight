import {
  chapterContextUrl,
  type BibleProvider,
  type PassageQuery,
} from "@/lib/bible/BibleProvider";
import type { BiblePassageText } from "@/types/bible";

/**
 * MVP provider. Returns clearly-labeled placeholder text instead of real
 * scripture, so the whole flow (search → group → explain → open passage) can
 * be exercised before any Bible API is integrated. It still returns a real,
 * working "read the full chapter" link (Bible Gateway needs no key), because a
 * URL is not fabricated scripture.
 */
export class MockBibleProvider implements BibleProvider {
  readonly name = "mock";

  async getPassage(query: PassageQuery): Promise<BiblePassageText> {
    return {
      reference: query.reference,
      text:
        "Passage text would be fetched from the Bible API here. " +
        `(${query.reference}) — connect a Bible provider to show the actual verses. ` +
        "Until then, use the “Read full chapter” link to read the passage in context.",
      translation: "MOCK",
      chapterUrl: chapterContextUrl(query.book, query.chapter),
      isPlaceholder: true,
    };
  }
}
