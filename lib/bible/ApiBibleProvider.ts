import {
  chapterContextUrl,
  type BibleProvider,
  type PassageQuery,
} from "@/lib/bible/BibleProvider";
import type { BiblePassageText } from "@/types/bible";

/**
 * Stub provider wired for API.Bible (https://scripture.api.bible).
 *
 * NOT activated by default — the factory in `index.ts` only returns this when
 * BIBLE_PROVIDER=apibible. It is included so the real integration is a small,
 * well-marked change rather than a rewrite. To finish it:
 *   1. Get a free key at https://scripture.api.bible and set BIBLE_API_KEY.
 *   2. Choose a bible id (BIBLE_ID), e.g. a World English Bible edition.
 *   3. Map book names to API.Bible book ids (see `bookIdFor`).
 *   4. Verify the verse-range query params against the current API docs.
 */
export class ApiBibleProvider implements BibleProvider {
  readonly name = "api.bible";

  private readonly apiKey = process.env.BIBLE_API_KEY;
  private readonly bibleId = process.env.BIBLE_ID ?? "9879dbb7cfe39e4d-01"; // WEB (example)
  private readonly baseUrl = "https://api.scripture.api.bible/v1";

  async getPassage(query: PassageQuery): Promise<BiblePassageText> {
    if (!this.apiKey) {
      throw new Error(
        "ApiBibleProvider selected but BIBLE_API_KEY is not set. " +
          "Set BIBLE_API_KEY (and optionally BIBLE_ID), or use BIBLE_PROVIDER=mock.",
      );
    }

    const bookId = bookIdFor(query.book);
    if (!bookId) {
      throw new Error(`No API.Bible book id mapping for "${query.book}".`);
    }

    // API.Bible verse ids look like BOOK.CHAPTER.VERSE, e.g. JAS.1.2
    const startId = `${bookId}.${query.chapter}.${query.startVerse}`;
    const endId = `${bookId}.${query.chapter}.${query.endVerse}`;
    const passageId = startId === endId ? startId : `${startId}-${endId}`;

    const url = new URL(`${this.baseUrl}/bibles/${this.bibleId}/passages/${passageId}`);
    url.searchParams.set("content-type", "text");
    url.searchParams.set("include-notes", "false");
    url.searchParams.set("include-titles", "false");
    url.searchParams.set("include-verse-numbers", "true");

    const res = await fetch(url, {
      headers: { "api-key": this.apiKey },
      // Cache passages briefly; they never change.
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) {
      throw new Error(`API.Bible request failed: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as {
      data?: { content?: string; reference?: string };
    };
    const text = json.data?.content?.trim();
    if (!text) {
      throw new Error("API.Bible returned no passage content.");
    }

    return {
      reference: json.data?.reference ?? query.reference,
      text,
      translation: this.bibleId,
      chapterUrl: chapterContextUrl(query.book, query.chapter),
      isPlaceholder: false,
    };
  }
}

/**
 * Minimal book-name → API.Bible book-id map covering the books used in the
 * curated index. Extend as the corpus grows.
 */
const BOOK_IDS: Record<string, string> = {
  genesis: "GEN",
  deuteronomy: "DEU",
  joshua: "JOS",
  psalms: "PSA",
  proverbs: "PRO",
  ecclesiastes: "ECC",
  isaiah: "ISA",
  jeremiah: "JER",
  lamentations: "LAM",
  matthew: "MAT",
  romans: "ROM",
  "1 corinthians": "1CO",
  galatians: "GAL",
  ephesians: "EPH",
  philippians: "PHP",
  colossians: "COL",
  hebrews: "HEB",
  james: "JAS",
  "1 peter": "1PE",
};

function bookIdFor(book: string): string | undefined {
  return BOOK_IDS[book.trim().toLowerCase()];
}
