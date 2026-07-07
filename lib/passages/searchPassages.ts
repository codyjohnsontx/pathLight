import { getAllPassages } from "@/lib/passages/passageIndex";
import type { PassageSuggestion } from "@/types/bible";
import type { Classification, ThemeGroup } from "@/types/guidance";

/**
 * AI Step 2: retrieve passages from the curated index and group them.
 *
 * This is deterministic keyword/tag scoring — no model involved. The AI never
 * gets to pick passages; it only ever explains the ones this function returns,
 * which is what prevents invented references.
 */

const WEIGHT_THEME = 3; // spiritualThemes ∩ passage.themes
const WEIGHT_EMOTION = 2; // emotionalState ∩ passage.emotionalUseCases
const WEIGHT_KEYWORD = 1; // searchKeywords found in passage text/tags

const MAX_PASSAGES = 12; // upper bound on retrieved passages
const MIN_BEFORE_FALLBACK = 5; // below this, top up with general encouragement
const MAX_GROUPS = 5;
const MIN_GROUP = 2;
const MAX_GROUP = 4;

/** General, broadly-comforting passages used to top up sparse result sets. */
const FALLBACK_IDS = [
  "psalm-23-1-4",
  "romans-8-38-39",
  "matthew-11-28-30",
  "philippians-4-6-7",
  "lamentations-3-22-23",
  "isaiah-41-10",
  "proverbs-3-5-6",
];

type ScoredPassage = {
  passage: PassageSuggestion;
  score: number;
  /** The passage theme that best connects it to the user's situation. */
  dominantTheme: string;
};

function lower(arr: string[]): Set<string> {
  return new Set(arr.map((s) => s.toLowerCase()));
}

function overlapCount(a: string[], bSet: Set<string>): number {
  let n = 0;
  for (const item of a) if (bSet.has(item.toLowerCase())) n++;
  return n;
}

/** Score a single passage against the classification. */
function scorePassage(
  passage: PassageSuggestion,
  themes: Set<string>,
  emotions: Set<string>,
  keywords: string[],
): number {
  let score = 0;
  score += overlapCount(passage.themes, themes) * WEIGHT_THEME;
  score += overlapCount(passage.emotionalUseCases, emotions) * WEIGHT_EMOTION;

  if (keywords.length) {
    const haystack = [
      passage.reference,
      passage.summary,
      passage.themes.join(" "),
      passage.emotionalUseCases.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    for (const kw of keywords) {
      const k = kw.trim().toLowerCase();
      if (k.length >= 3 && haystack.includes(k)) score += WEIGHT_KEYWORD;
    }
  }
  return score;
}

/** Pick the passage theme that best ties it to the user's spiritual themes. */
function dominantTheme(
  passage: PassageSuggestion,
  themes: Set<string>,
): string {
  const match = passage.themes.find((t) => themes.has(t.toLowerCase()));
  return match ?? passage.themes[0];
}

/** Score every passage, dropping avoided topics and zero-score entries. */
function scoreAll(classification: Classification): ScoredPassage[] {
  const themes = lower(classification.spiritualThemes);
  const emotions = lower(classification.emotionalState);
  const avoid = lower(classification.topicsToAvoid);
  const keywords = classification.searchKeywords ?? [];

  const scored: ScoredPassage[] = [];
  for (const passage of getAllPassages()) {
    // Exclude passages whose themes intersect topics the user wants to avoid.
    if (passage.themes.some((t) => avoid.has(t.toLowerCase()))) continue;

    const score = scorePassage(passage, themes, emotions, keywords);
    if (score <= 0) continue;
    scored.push({
      passage,
      score,
      dominantTheme: dominantTheme(passage, themes),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/** Top up a thin result set with general encouragement passages. */
function withFallback(
  scored: ScoredPassage[],
  themes: Set<string>,
): ScoredPassage[] {
  if (scored.length >= MIN_BEFORE_FALLBACK) return scored;

  const present = new Set(scored.map((s) => s.passage.id));
  const all = getAllPassages();
  const result = [...scored];

  for (const id of FALLBACK_IDS) {
    if (result.length >= MIN_BEFORE_FALLBACK) break;
    if (present.has(id)) continue;
    const passage = all.find((p) => p.id === id);
    if (!passage) continue;
    result.push({
      passage,
      score: 1,
      dominantTheme: dominantTheme(passage, themes),
    });
    present.add(id);
  }
  return result;
}

function aggregate(items: ScoredPassage[]): number {
  return items.reduce((sum, s) => sum + s.score, 0);
}

/**
 * Group the retrieved passages into up to 5 themed buckets of 2-4 passages.
 * Buckets are keyed by dominant theme and ranked by aggregate score. Healthy
 * buckets (>= MIN_GROUP) are used directly and enriched with same-theme
 * leftovers; if no bucket reaches MIN_GROUP, the top passages are chunked so a
 * usable result is still returned. Never returns empty for a non-empty input.
 */
function groupPassages(scored: ScoredPassage[]): ThemeGroup[] {
  if (scored.length === 0) return [];

  const buckets = new Map<string, ScoredPassage[]>();
  for (const sp of scored) {
    const arr = buckets.get(sp.dominantTheme) ?? [];
    arr.push(sp);
    buckets.set(sp.dominantTheme, arr);
  }

  const ranked = [...buckets.entries()]
    .map(([theme, items]) => ({
      theme,
      items: items.sort((a, b) => b.score - a.score),
    }))
    .sort((a, b) => aggregate(b.items) - aggregate(a.items));

  const healthy = ranked
    .filter((g) => g.items.length >= MIN_GROUP)
    .slice(0, MAX_GROUPS)
    .map((g) => ({ theme: g.theme, items: g.items.slice(0, MAX_GROUP) }));

  if (healthy.length > 0) {
    // Fill under-full groups with leftover passages that share the theme.
    const used = new Set(healthy.flatMap((g) => g.items.map((i) => i.passage.id)));
    const leftovers = scored
      .filter((sp) => !used.has(sp.passage.id))
      .sort((a, b) => b.score - a.score);
    for (const g of healthy) {
      for (const sp of leftovers) {
        if (g.items.length >= MAX_GROUP) break;
        if (used.has(sp.passage.id)) continue;
        if (sp.passage.themes.includes(g.theme)) {
          g.items.push(sp);
          used.add(sp.passage.id);
        }
      }
    }
    return healthy.map((g) => ({
      theme: g.theme,
      passages: g.items.map((i) => i.passage),
    }));
  }

  // Pathological: no single theme reached MIN_GROUP. Chunk the top passages so
  // the user still gets usable, real suggestions (order preserved by score).
  const top = scored.slice(0, MAX_GROUPS * MAX_GROUP);
  const chunks: ThemeGroup[] = [];
  for (let i = 0; i < top.length; i += MAX_GROUP) {
    const chunk = top.slice(i, i + MAX_GROUP);
    chunks.push({
      theme: chunk[0].dominantTheme,
      passages: chunk.map((c) => c.passage),
    });
  }
  return chunks.slice(0, MAX_GROUPS);
}

/**
 * Retrieve and group passages for a classification. Returns 0-5 groups; the
 * flat, deduped passage list can be derived from the groups by callers that
 * need the "only these passages" constraint set.
 */
export function searchPassages(classification: Classification): ThemeGroup[] {
  const themes = lower(classification.spiritualThemes);
  const scored = withFallback(scoreAll(classification), themes).slice(
    0,
    MAX_PASSAGES,
  );
  return groupPassages(scored);
}

/** Flatten grouped passages into a deduped list (grouping order preserved). */
export function flattenGroups(groups: ThemeGroup[]): PassageSuggestion[] {
  const seen = new Set<string>();
  const flat: PassageSuggestion[] = [];
  for (const g of groups) {
    for (const p of g.passages) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      flat.push(p);
    }
  }
  return flat;
}
