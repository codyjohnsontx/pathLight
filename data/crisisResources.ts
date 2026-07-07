import type { CrisisResponse } from "@/types/guidance";

/**
 * Crisis handling.
 *
 * Detection here is deterministic keyword matching that runs as CODE in the
 * /api/ask route, BEFORE and independent of any LLM. That means a broken or
 * misbehaving model cannot cause the app to answer a self-harm/abuse/danger
 * message with verses instead of pointing toward immediate human help.
 *
 * Keyword lists lean toward *current danger / present intent* phrasing. Abuse
 * terms in particular are scoped to ongoing-harm wording so that a sincere
 * "help me forgive someone who hurt me" question is not misrouted to a crisis
 * screen. False positives are acceptable; false negatives are the thing to
 * avoid, so when unsure the detector errs toward showing help.
 */

/** Substrings scanned (case-insensitive) against the raw user question. */
export const crisisKeywords: string[] = [
  // suicidal ideation / intent
  "kill myself",
  "killing myself",
  "end my life",
  "ending my life",
  "take my own life",
  "want to die",
  "wanna die",
  "don't want to live",
  "dont want to live",
  "no reason to live",
  "better off dead",
  "suicid", // suicide / suicidal
  "overdose",
  // self-harm
  "hurt myself",
  "harm myself",
  "self harm",
  "self-harm",
  "cut myself",
  "cutting myself",
  // abuse / immediate danger (present-tense / ongoing)
  "being abused",
  "abusing me",
  "he abuses me",
  "she abuses me",
  "they abuse me",
  // Subject-qualified to avoid idiom false positives ("beats me" = "I don't
  // know"; "it hits me hard") while still catching clear abuse disclosures.
  "he hits me",
  "she hits me",
  "they hit me",
  "he beats me",
  "she beats me",
  "hurting me",
  "in danger",
  "not safe at home",
  "afraid for my life",
  "afraid for my safety",
  "threatening to kill",
  "threatening to hurt",
];

/** Returns true if the text contains any crisis indicator. */
export function detectCrisis(text: string): boolean {
  const haystack = text.toLowerCase();
  return crisisKeywords.some((kw) => haystack.includes(kw));
}

/**
 * The crisis-support response shown INSTEAD of passages. Gentle, non-clinical,
 * and oriented toward reaching a real person right now. Resources are
 * US/Canada-oriented with a prompt to find local equivalents elsewhere.
 */
export function buildCrisisResponse(): CrisisResponse {
  return {
    kind: "crisis",
    message:
      "It sounds like you may be carrying something really heavy right now, and I care about what happens to you. I'm just an app, and this is a moment to reach a real person who can help — please don't go through it alone. Talking to someone doesn't mean anything is wrong with you; it's a strong and wise thing to do.",
    resources: [
      {
        name: "988 Suicide & Crisis Lifeline (US)",
        detail:
          "Free, confidential support 24/7 for you or someone you're worried about.",
        contact: "Call or text 988",
      },
      {
        name: "Crisis Text Line",
        detail: "Text with a trained crisis counselor, 24/7.",
        contact: "Text HOME to 741741 (US) / 686868 (CA) / 85258 (UK)",
      },
      {
        name: "Immediate danger",
        detail:
          "If you or someone else is in immediate danger, please contact emergency services now.",
        contact: "Call 911 (US) or your local emergency number",
      },
      {
        name: "A trusted person",
        detail:
          "If you can, reach out to someone you trust today — a friend, family member, pastor, or counselor — and tell them how you're really doing.",
      },
    ],
    disclaimer:
      "Pathlight is not a counselor, doctor, or emergency service. Please reach out to the resources above or a trusted person for real support.",
  };
}
