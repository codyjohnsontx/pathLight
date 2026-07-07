/**
 * Types for the /api/ask flow: classification, retrieval grouping, and the
 * final guidance (or crisis) response returned to the client.
 */

import type { PassageSuggestion } from "@/types/bible";

/** Request body for POST /api/ask. */
export type AskRequest = {
  question: string;
};

/**
 * Output of AI Step 1 (classification). The model returns JSON only; it does
 * not give advice at this stage. Used to drive local passage retrieval.
 */
export type Classification = {
  situation: string;
  emotionalState: string[];
  spiritualThemes: string[];
  searchKeywords: string[];
  topicsToAvoid: string[];
  crisisDetected: boolean;
};

/**
 * A deterministic grouping of retrieved passages (AI Step 2 output). The AI
 * that writes the final response may only reference passages that appear here.
 */
export type ThemeGroup = {
  /** The dominant matched theme label for this group (e.g. "perseverance"). */
  theme: string;
  passages: PassageSuggestion[];
};

/** A passage reference + the reason it was chosen, inside a guidance theme. */
export type GuidancePassage = {
  reference: string;
  reason: string;
};

/** One themed suggestion card in the final guidance response (AI Step 3). */
export type GuidanceTheme = {
  title: string;
  explanation: string;
  passages: GuidancePassage[];
  reflectionQuestion: string;
  prayerPrompt?: string;
};

/** The successful, passage-based guidance response. */
export type GuidanceResponse = {
  kind: "guidance";
  openingMessage: string;
  themes: GuidanceTheme[];
  disclaimer: string;
};

/** A single crisis-support resource shown instead of passages. */
export type CrisisResource = {
  name: string;
  detail: string;
  /** Optional contact string (phone/text/URL). */
  contact?: string;
};

/**
 * Returned instead of guidance when a crisis is detected. It gently points the
 * user toward immediate human help rather than offering verses as an answer.
 */
export type CrisisResponse = {
  kind: "crisis";
  message: string;
  resources: CrisisResource[];
  disclaimer: string;
};

/** Discriminated union returned by /api/ask. */
export type AskResponse = GuidanceResponse | CrisisResponse;
