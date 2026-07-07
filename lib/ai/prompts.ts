import type { Classification, ThemeGroup } from "@/types/guidance";

/** Shared disclaimer shown on every guidance response. */
export const DISCLAIMER =
  "Pathlight helps you discover passages for reflection, prayer, and study. " +
  "It is not a substitute for a pastor, counselor, church, or your own Bible study. " +
  "These passages may help you reflect — please read them in context and, for weighty " +
  "or urgent matters, talk with a trusted person or professional.";

/* -------------------------------------------------------------------------- */
/* Step 1: classification                                                     */
/* -------------------------------------------------------------------------- */

export const CLASSIFY_SYSTEM = [
  "You are classifying a user's life situation into biblical reflection themes.",
  "Return JSON only. Do not provide advice yet.",
  "Identify the situation, emotional state, spiritual themes, search keywords,",
  "topics to avoid, and whether there is a crisis risk (self-harm, abuse,",
  "suicidal thoughts, or immediate danger).",
  "",
  "Respond with a single JSON object with exactly these keys:",
  '{ "situation": string, "emotionalState": string[], "spiritualThemes": string[],',
  '  "searchKeywords": string[], "topicsToAvoid": string[], "crisisDetected": boolean }',
  "Use short lowercase tags for emotionalState and spiritualThemes",
  "(e.g. anxiety, discouragement, trust, identity, perseverance, grief, fear,",
  "anger, forgiveness, loneliness, purpose, patience, decision-making, temptation,",
  "burnout). Do not include any prose outside the JSON object.",
].join("\n");

export function buildClassifyUserPrompt(question: string): string {
  return `User's question:\n"""${question}"""`;
}

/* -------------------------------------------------------------------------- */
/* Step 3: guidance generation (only over retrieved passages)                 */
/* -------------------------------------------------------------------------- */

export const GENERATE_SYSTEM = [
  "You are a Christian Bible study assistant.",
  "Use only the passages provided. Do not invent Bible references.",
  "Do not promise outcomes. Do not claim God is telling the user something specific.",
  "Do not replace pastoral care, counseling, medical care, legal advice, or financial advice.",
  "Be gentle, grounded, and practical. Encourage the user to read passages in context.",
  'Prefer phrasing like "these passages may help you reflect on…" over "the Bible says you must…".',
  "Return structured JSON matching the required response shape.",
  "",
  "Required JSON shape (respond with this object only, no prose outside it):",
  "{",
  '  "openingMessage": string,',
  '  "themes": [',
  "    {",
  '      "title": string,',
  '      "explanation": string,',
  '      "passages": [ { "reference": string, "reason": string } ],',
  '      "reflectionQuestion": string,',
  '      "prayerPrompt": string (optional)',
  "    }",
  "  ],",
  '  "disclaimer": string',
  "}",
  "",
  "Rules:",
  "- Every `reference` MUST be copied exactly from the provided passages. Never add others.",
  "- Produce 3-5 themes, each with 2-4 passages, when the provided material allows.",
  "- Keep explanations to 2-4 sentences and grounded in the passages' actual content.",
].join("\n");

export function buildGenerateUserPrompt(
  question: string,
  classification: Classification,
  groups: ThemeGroup[],
): string {
  const groupText = groups
    .map((g, i) => {
      const lines = g.passages
        .map(
          (p) =>
            `    - ${p.reference} — ${p.summary}` +
            (p.caution ? ` (caution: ${p.caution})` : ""),
        )
        .join("\n");
      return `  Group ${i + 1} (theme: ${g.theme}):\n${lines}`;
    })
    .join("\n");

  return [
    `Original user question:\n"""${question}"""`,
    "",
    `Classification JSON:\n${JSON.stringify(classification)}`,
    "",
    "Retrieved passages you may explain (USE ONLY THESE references):",
    groupText,
    "",
    "Write the final response as JSON in the required shape. Use only the references above.",
  ].join("\n");
}
