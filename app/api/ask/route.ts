import { NextResponse } from "next/server";

import { buildCrisisResponse, detectCrisis } from "@/data/crisisResources";
import { classifyQuestion } from "@/lib/ai/classifyQuestion";
import { generateGuidance } from "@/lib/ai/generateGuidance";
import { AskRequestSchema } from "@/lib/ai/schemas";
import { searchPassages } from "@/lib/passages/searchPassages";

export const runtime = "nodejs";

/**
 * POST /api/ask
 *
 * Input:  { question: string }
 * Output: GuidanceResponse | CrisisResponse (discriminated by `kind`)
 *
 * Flow (see the plan / README):
 *   1. Validate the body.
 *   2. Deterministic crisis gate — CODE, before any model. Short-circuits to a
 *      human-help response so a broken model can never answer a crisis with verses.
 *   3. Classify the question (mock or Llama).
 *   4. Second crisis gate from the classifier.
 *   5. Retrieve + group curated passages (deterministic).
 *   6. Generate guidance using ONLY the retrieved passages.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = AskRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const question = parsed.data.question;

  try {
    // 2. Deterministic crisis gate.
    if (detectCrisis(question)) {
      return NextResponse.json(buildCrisisResponse());
    }

    // 3. Classify.
    const classification = await classifyQuestion(question);

    // 4. Second crisis gate (model-flagged).
    if (classification.crisisDetected) {
      return NextResponse.json(buildCrisisResponse());
    }

    // 5. Retrieve + group.
    const groups = searchPassages(classification);

    // 6. Generate guidance over the retrieved passages only.
    const guidance = await generateGuidance(question, classification, groups);
    return NextResponse.json(guidance);
  } catch (err) {
    console.error("[/api/ask] unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong finding passages. Please try again." },
      { status: 500 },
    );
  }
}
