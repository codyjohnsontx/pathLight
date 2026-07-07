import { z } from "zod";

/**
 * Zod schemas used to validate (a) the incoming /api/ask request and (b) the
 * JSON produced by the LLM. Validating model output is what lets us safely fall
 * back to the deterministic mock when a small open model returns malformed or
 * off-spec JSON.
 */

export const AskRequestSchema = z.object({
  question: z.string().trim().min(1, "Please enter a question.").max(2000),
});

export const ClassificationSchema = z.object({
  situation: z.string().default(""),
  emotionalState: z.array(z.string()).default([]),
  spiritualThemes: z.array(z.string()).default([]),
  searchKeywords: z.array(z.string()).default([]),
  topicsToAvoid: z.array(z.string()).default([]),
  crisisDetected: z.boolean().default(false),
});

export const GuidancePassageSchema = z.object({
  reference: z.string(),
  reason: z.string(),
});

export const GuidanceThemeSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  passages: z.array(GuidancePassageSchema).default([]),
  reflectionQuestion: z.string(),
  prayerPrompt: z.string().optional(),
});

/** The LLM returns this shape (without the `kind` tag, which we add). */
export const GuidanceModelOutputSchema = z.object({
  openingMessage: z.string(),
  themes: z.array(GuidanceThemeSchema).default([]),
  disclaimer: z.string().optional(),
});

export type GuidanceModelOutput = z.infer<typeof GuidanceModelOutputSchema>;
