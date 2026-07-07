import type { BiblePassageText } from "@/types/bible";
import type { AskResponse } from "@/types/guidance";

/** Client-side fetch helpers for the Pathlight API routes. */

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

/** Submit a question to /api/ask. Returns guidance or a crisis response. */
export async function askQuestion(question: string): Promise<AskResponse> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    throw new Error(await readError(res, "Could not get a response. Please try again."));
  }
  return (await res.json()) as AskResponse;
}

/** Load a passage's text from /api/passage. */
export async function fetchPassage(reference: string): Promise<BiblePassageText> {
  const res = await fetch(`/api/passage?ref=${encodeURIComponent(reference)}`);
  if (!res.ok) {
    throw new Error(await readError(res, "Could not load this passage."));
  }
  return (await res.json()) as BiblePassageText;
}
