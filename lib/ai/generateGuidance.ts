import { useLlama } from "@/lib/ai/config";
import { generateWithLlama } from "@/lib/ai/llamaClient";
import { mockGuidance } from "@/lib/ai/mock";
import { DISCLAIMER } from "@/lib/ai/prompts";
import type { GuidanceModelOutput } from "@/lib/ai/schemas";
import { flattenGroups } from "@/lib/passages/searchPassages";
import type {
  Classification,
  GuidanceResponse,
  GuidanceTheme,
  ThemeGroup,
} from "@/types/guidance";

/** Normalize a reference for comparison (dashes, case, spacing). */
function normalizeRef(ref: string): string {
  return ref
    .toLowerCase()
    .replace(/[‒–—―]/g, "-") // various dashes → hyphen
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Enforce the core guardrail on model output: keep only references that were
 * actually retrieved from the curated index, and rewrite them to the canonical
 * form. Anything the model invented is dropped. Themes left with no valid
 * passage are removed. Returns null if nothing usable survives (→ fall back).
 */
function sanitizeGuidance(
  output: GuidanceModelOutput,
  groups: ThemeGroup[],
): GuidanceResponse | null {
  const canonicalByRef = new Map<string, string>();
  for (const p of flattenGroups(groups)) {
    canonicalByRef.set(normalizeRef(p.reference), p.reference);
  }

  const themes: GuidanceTheme[] = [];
  for (const theme of output.themes) {
    if (!theme.title?.trim() || !theme.explanation?.trim()) continue;

    const seen = new Set<string>();
    const passages = [];
    for (const p of theme.passages) {
      const canonical = canonicalByRef.get(normalizeRef(p.reference ?? ""));
      if (!canonical || seen.has(canonical)) continue;
      seen.add(canonical);
      passages.push({
        reference: canonical,
        reason: (p.reason ?? "").trim() || "A passage to reflect on.",
      });
    }
    if (passages.length === 0) continue;

    themes.push({
      title: theme.title.trim(),
      explanation: theme.explanation.trim(),
      passages,
      reflectionQuestion:
        theme.reflectionQuestion?.trim() ||
        "What might God be inviting you to notice as you sit with these passages?",
      prayerPrompt: theme.prayerPrompt?.trim() || undefined,
    });
  }

  if (themes.length === 0) return null;

  return {
    kind: "guidance",
    openingMessage:
      output.openingMessage?.trim() ||
      "These passages may help you reflect during this season.",
    themes,
    disclaimer: DISCLAIMER, // always our disclaimer, never the model's
  };
}

/**
 * AI Step 3: write the final guidance using only the retrieved passages. Real
 * LLM output is validated (in llamaClient) and then sanitized here; on any
 * failure or empty result, falls back to the deterministic mock.
 */
export async function generateGuidance(
  question: string,
  classification: Classification,
  groups: ThemeGroup[],
): Promise<GuidanceResponse> {
  if (useLlama()) {
    try {
      const raw = await generateWithLlama(question, classification, groups);
      const sanitized = sanitizeGuidance(raw, groups);
      if (sanitized) return sanitized;
      console.warn("[ai] generateGuidance: no valid passages survived, using mock");
    } catch (err) {
      console.warn(
        "[ai] generateGuidance: LLM failed, using mock —",
        (err as Error)?.message,
      );
    }
  }
  return mockGuidance(question, classification, groups);
}
