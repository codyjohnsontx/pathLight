import OpenAI from "openai";

import {
  buildClassifyUserPrompt,
  buildGenerateUserPrompt,
  CLASSIFY_SYSTEM,
  GENERATE_SYSTEM,
} from "@/lib/ai/prompts";
import {
  ClassificationSchema,
  GuidanceModelOutputSchema,
  type GuidanceModelOutput,
} from "@/lib/ai/schemas";
import type { Classification, ThemeGroup } from "@/types/guidance";

/**
 * Real AI path via any OpenAI-compatible endpoint. Configured entirely by env
 * so the same code works against free options:
 *   - Groq (hosted, free tier):  AI_BASE_URL=https://api.groq.com/openai/v1
 *                                AI_MODEL=llama-3.3-70b-versatile, AI_API_KEY=<key>
 *   - Ollama (local, free):      AI_BASE_URL=http://localhost:11434/v1
 *                                AI_MODEL=llama3.1, AI_API_KEY=ollama
 * Anything else OpenAI-compatible (Together, OpenRouter, …) also works.
 *
 * Callers wrap these in try/catch and fall back to the deterministic mock, so a
 * missing key, an unreachable endpoint, or malformed JSON never breaks /api/ask.
 *
 * PRIVACY: on the non-mock path the user's question leaves this server. The
 * buildClassifyUserPrompt / buildGenerateUserPrompt payloads contain the user's
 * situation text and are sent to the configured provider (e.g. Groq) as a third
 * party. Before enabling a hosted provider in production, review that provider's
 * data-use and retention terms and your users' consent expectations. Ollama
 * (a local AI_BASE_URL) keeps the data on your own machine.
 */

const BASE_URL = process.env.AI_BASE_URL ?? "http://localhost:11434/v1";
const API_KEY = process.env.AI_API_KEY ?? "ollama"; // Ollama ignores the value
const MODEL = process.env.AI_MODEL ?? "llama3.1";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });
  return client;
}

/** Extract a JSON object from a model response, tolerating ```json fences. */
function parseJsonLoose(content: string): unknown {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  return JSON.parse(text);
}

/** Chat completion that returns parsed JSON. Retries without json mode. */
async function chatJson(system: string, user: string): Promise<unknown> {
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  const c = getClient();
  let content: string | null | undefined;
  try {
    const res = await c.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });
    content = res.choices[0]?.message?.content;
  } catch {
    // Some backends/models reject response_format — retry relying on the prompt.
    const res = await c.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.4,
    });
    content = res.choices[0]?.message?.content;
  }

  if (!content) throw new Error("Empty response from AI provider.");
  return parseJsonLoose(content);
}

/** AI Step 1 via Llama. Throws if output fails validation. */
export async function classifyWithLlama(
  question: string,
): Promise<Classification> {
  const raw = await chatJson(CLASSIFY_SYSTEM, buildClassifyUserPrompt(question));
  return ClassificationSchema.parse(raw);
}

/** AI Step 3 via Llama. Returns the raw (untrusted) model output for sanitizing. */
export async function generateWithLlama(
  question: string,
  classification: Classification,
  groups: ThemeGroup[],
): Promise<GuidanceModelOutput> {
  const raw = await chatJson(
    GENERATE_SYSTEM,
    buildGenerateUserPrompt(question, classification, groups),
  );
  return GuidanceModelOutputSchema.parse(raw);
}
