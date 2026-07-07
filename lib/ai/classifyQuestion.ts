import { useLlama } from "@/lib/ai/config";
import { classifyWithLlama } from "@/lib/ai/llamaClient";
import { mockClassify } from "@/lib/ai/mock";
import type { Classification } from "@/types/guidance";

/**
 * AI Step 1: classify the user's question into structured reflection themes.
 * Routes to the real Llama endpoint when configured, otherwise the mock. On any
 * error from the real path, falls back to the deterministic mock so the flow
 * never breaks.
 */
export async function classifyQuestion(
  question: string,
): Promise<Classification> {
  if (useLlama()) {
    try {
      return await classifyWithLlama(question);
    } catch (err) {
      console.warn(
        "[ai] classifyQuestion: LLM failed, using mock —",
        (err as Error)?.message,
      );
    }
  }
  return mockClassify(question);
}
