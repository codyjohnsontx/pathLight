import { detectCrisis } from "@/data/crisisResources";
import { DISCLAIMER } from "@/lib/ai/prompts";
import type {
  Classification,
  GuidanceResponse,
  GuidanceTheme,
  ThemeGroup,
} from "@/types/guidance";

/**
 * Deterministic, no-network stand-ins for the two AI steps. Built first (per
 * the "mock AI first" goal) and also used as the fallback whenever the real
 * LLM path errors or returns unusable output. Every word here is derived from
 * the curated passage data, so the mock is grounded by construction.
 */

/* -------------------------------------------------------------------------- */
/* Step 1: classification (keyword rules)                                      */
/* -------------------------------------------------------------------------- */

type Rule = { patterns: string[]; themes: string[]; emotions: string[] };

// Ordered rules; a question can match several. Tags use the same vocabulary as
// the passage index so retrieval matches.
const RULES: Rule[] = [
  {
    patterns: ["job", "unemploy", "career", "interview", "hired", "laid off", "resume", "application", "fired"],
    themes: ["work", "perseverance", "trust", "purpose"],
    emotions: ["job search", "discouragement"],
  },
  {
    patterns: ["anxious", "anxiety", "worried", "worry", "stress", "panic", "nervous", "overwhelm"],
    themes: ["anxiety", "trust", "comfort"],
    emotions: ["anxiety", "overwhelmed"],
  },
  {
    patterns: ["afraid", "scared", "fear", "terrified", "frightened"],
    themes: ["fear", "courage", "trust"],
    emotions: ["fear"],
  },
  {
    patterns: ["discouraged", "hopeless", "giving up", "give up", "defeated", "feel down", "feeling down", "depress"],
    themes: ["perseverance", "hope", "comfort"],
    emotions: ["discouragement"],
  },
  {
    patterns: ["grief", "grieving", "loss", "died", "death", "mourning", "passed away", "lost my"],
    themes: ["grief", "comfort", "hope"],
    emotions: ["grief"],
  },
  {
    patterns: ["lonely", "alone", "isolated", "no friends", "nobody", "left out"],
    themes: ["loneliness", "identity", "comfort"],
    emotions: ["loneliness"],
  },
  {
    patterns: ["angry", "anger", "furious", "rage", "resentment", "bitter", "mad at"],
    themes: ["anger", "patience"],
    emotions: ["anger", "conflict"],
  },
  {
    patterns: ["forgive", "forgiveness", "forgiving", "grudge", "hurt me", "wronged"],
    themes: ["forgiveness", "anger"],
    emotions: ["forgiveness", "conflict"],
  },
  {
    patterns: ["worthless", "not enough", "not good enough", "identity", "value", "rejected", "rejection"],
    themes: ["identity", "worth", "security"],
    emotions: ["rejection", "identity"],
  },
  {
    patterns: ["purpose", "meaning", "point of", "why am i here", "calling", "significance"],
    themes: ["purpose", "identity"],
    emotions: ["purpose"],
  },
  {
    patterns: ["patience", "impatient", "waiting", "taking so long", "how long"],
    themes: ["patience", "hope", "trust"],
    emotions: ["waiting"],
  },
  {
    patterns: ["decision", "decide", "choice", "choose", "what should i do", "which", "wisdom", "guidance", "direction"],
    themes: ["decision-making", "wisdom", "trust"],
    emotions: ["decision", "uncertainty"],
  },
  {
    patterns: ["tempt", "addiction", "can't stop", "keep doing", "struggle with"],
    themes: ["temptation", "trust"],
    emotions: ["temptation", "shame"],
  },
  {
    patterns: ["burned out", "burnout", "exhausted", "tired", "weary", "no energy", "running on empty"],
    themes: ["burnout", "rest", "comfort"],
    emotions: ["burnout", "overwhelmed"],
  },
  {
    patterns: ["uncertain", "don't know", "future", "control", "unknown", "unsure"],
    themes: ["trust", "hope"],
    emotions: ["uncertainty"],
  },
];

const STOPWORDS = new Set([
  "the", "and", "for", "with", "this", "that", "have", "about", "just", "really",
  "there", "some", "what", "when", "where", "which", "would", "could", "should",
  "from", "into", "your", "know", "feel", "feeling", "like", "been", "over",
  "them", "they", "will", "cant", "dont", "help", "anything", "through", "work",
]);

function extractKeywords(question: string): string[] {
  const words = question
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  return Array.from(new Set(words)).slice(0, 10);
}

/**
 * Match a pattern at a word boundary (prefix/stem match). This avoids substring
 * false positives — e.g. "rage" must NOT match inside "discouraged" — while
 * still letting stems like "unemploy" match "unemployed" and "depress" match
 * "depressed".
 */
function matchesPattern(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}`).test(text);
}

/** Rule-based classification used by the mock and as the LLM fallback. */
export function mockClassify(question: string): Classification {
  const text = question.toLowerCase();
  const themes = new Set<string>();
  const emotions = new Set<string>();

  for (const rule of RULES) {
    if (rule.patterns.some((p) => matchesPattern(text, p))) {
      rule.themes.forEach((t) => themes.add(t));
      rule.emotions.forEach((e) => emotions.add(e));
    }
  }

  // Sensible default so we always return usable classification.
  if (themes.size === 0) {
    ["trust", "hope", "comfort"].forEach((t) => themes.add(t));
    emotions.add("discouragement");
  }

  const trimmed = question.trim();
  const situation =
    trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;

  return {
    situation,
    emotionalState: Array.from(emotions),
    spiritualThemes: Array.from(themes),
    searchKeywords: extractKeywords(question),
    topicsToAvoid: [],
    crisisDetected: detectCrisis(question),
  };
}

/* -------------------------------------------------------------------------- */
/* Step 3: guidance (templates over retrieved passages)                        */
/* -------------------------------------------------------------------------- */

const TITLES: Record<string, string> = {
  perseverance: "Perseverance when progress feels slow",
  patience: "Patience while you wait",
  trust: "Trust when the future feels uncertain",
  hope: "Holding on to hope",
  work: "Working faithfully without panic",
  "decision-making": "Seeking wisdom for a decision",
  wisdom: "Asking God for wisdom",
  anxiety: "Bringing anxious thoughts to God",
  provision: "Trusting God to provide",
  identity: "Remembering your identity and worth",
  worth: "Remembering your worth to God",
  security: "Resting in God's love",
  love: "Resting in God's love",
  comfort: "Finding comfort in God's nearness",
  grief: "Comfort in grief and loss",
  fear: "Courage in the face of fear",
  courage: "Courage grounded in God's presence",
  loneliness: "You are not alone",
  contentment: "Contentment in God's presence",
  purpose: "Living with purpose",
  anger: "Handling anger wisely",
  forgiveness: "Working toward forgiveness",
  temptation: "Facing temptation with grace",
  burnout: "Rest for the weary",
  rest: "Finding rest in Christ",
};

const REFLECTIONS: Record<string, string> = {
  perseverance:
    "What is one faithful action you can take today without needing the whole outcome solved?",
  patience: "What might God be growing in you during this season of waiting?",
  trust: "What part of this situation feels outside your control right now?",
  hope: "Where have you seen God's faithfulness before that you can lean on now?",
  work: "What would excellent but non-anxious effort look like today?",
  "decision-making":
    "What would it look like to seek wise counsel before deciding?",
  wisdom: "Who could you talk with as you pray for wisdom here?",
  anxiety: "What is one worry you could name honestly to God right now?",
  identity: "What would change if you treated this as an event, not an identity?",
  worth: "How might you remember your worth apart from this circumstance?",
  security: "What does it mean that nothing can separate you from God's love?",
  comfort: "Where do you most need to sense God's nearness today?",
  grief: "What would it look like to bring your honest sorrow to God?",
  fear: "What would courage look like as a next small step?",
  courage: "What is one brave, faithful thing you can do this week?",
  loneliness: "Who is one person you could reach toward this week?",
  purpose: "What good work in front of you could you do wholeheartedly?",
  anger: "What would a soft, honest response look like in this situation?",
  forgiveness:
    "What is one small step toward releasing this, even if the feeling isn't there yet?",
  temptation: "What way of escape might God be providing that you could take?",
  burnout: "What is one thing you could set down and bring to God for rest?",
};

const PRAYERS: Record<string, string> = {
  perseverance:
    "God, give me strength to keep going and trust you with the timing.",
  trust: "Lord, I give you what I can't control, and I choose to trust you.",
  anxiety: "Father, here is what I'm anxious about — please give me your peace.",
  identity: "God, help me rest in who I am to you, whatever happens.",
  work: "Lord, let me work faithfully today and leave the results with you.",
  grief: "God, be near to me in this grief and hold what I can't carry.",
  fear: "Lord, when I'm afraid, help me remember you are with me.",
  loneliness: "God, help me feel your presence, and lead me toward others.",
  forgiveness: "Father, help me take one honest step toward forgiveness.",
  burnout: "Jesus, I'm weary — teach me to find rest in you.",
  "decision-making": "God, give me wisdom, and steady me to trust your guidance.",
};

function titleFor(theme: string): string {
  return TITLES[theme] ?? `Reflecting on ${theme}`;
}

function themeGuidance(group: ThemeGroup): GuidanceTheme {
  const first = group.passages[0];
  const explanation =
    `These passages may help you reflect on ${group.theme}. ` +
    (first ? `${first.summary} ` : "") +
    "Read them slowly and in their surrounding context, letting them shape your prayer rather than dictate an outcome.";

  return {
    title: titleFor(group.theme),
    explanation,
    passages: group.passages.map((p) => ({
      reference: p.reference,
      reason: p.summary,
    })),
    reflectionQuestion:
      REFLECTIONS[group.theme] ??
      "What might God be inviting you to notice as you sit with these passages?",
    prayerPrompt: PRAYERS[group.theme],
  };
}

/** Template guidance built entirely from the retrieved passages. */
export function mockGuidance(
  _question: string,
  classification: Classification,
  groups: ThemeGroup[],
): GuidanceResponse {
  const themeLabels = groups.map((g) => g.theme);
  const themeList =
    themeLabels.length > 1
      ? `${themeLabels.slice(0, -1).join(", ")} and ${themeLabels.at(-1)}`
      : themeLabels[0] ?? "God's care for you";

  const openingMessage =
    "I'm sorry you're carrying that. It's a real and heavy thing to walk through. " +
    `These passages may help you reflect on ${themeList} during this season. ` +
    "They aren't magic answers — take them slowly, read them in context, and let them shape your prayer and reflection.";

  return {
    kind: "guidance",
    openingMessage,
    themes: groups.map(themeGuidance),
    disclaimer: DISCLAIMER,
  };
}
