import { NextResponse } from "next/server";

import { getBibleProvider, type PassageQuery } from "@/lib/bible";
import { findPassageByReference } from "@/lib/passages/passageIndex";

export const runtime = "nodejs";

/**
 * GET /api/passage?ref=James%201:2-4
 *
 * Returns the passage text from the configured Bible provider. The reference
 * MUST resolve to a passage in the curated index — arbitrary references are
 * rejected (404). This keeps the passage viewer bound to vetted references and
 * gives us the book/chapter/verse data the provider needs.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref")?.trim();

  if (!ref) {
    return NextResponse.json(
      { error: "Missing ?ref parameter." },
      { status: 400 },
    );
  }

  const passage = findPassageByReference(ref);
  if (!passage) {
    return NextResponse.json(
      { error: `Unknown passage reference: ${ref}` },
      { status: 404 },
    );
  }

  const query: PassageQuery = {
    reference: passage.reference,
    book: passage.book,
    chapter: passage.chapter,
    startVerse: passage.startVerse,
    endVerse: passage.endVerse,
  };

  try {
    const result = await getBibleProvider().getPassage(query);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/passage] provider error:", err);
    return NextResponse.json(
      { error: "Could not load this passage right now." },
      { status: 502 },
    );
  }
}
