/**
 * Which AI path to use. Defaults to the deterministic mock so the app runs with
 * no configuration. Set AI_PROVIDER=llama (with AI_BASE_URL/AI_API_KEY/AI_MODEL)
 * to use a real OpenAI-compatible Llama endpoint.
 */
export function useLlama(): boolean {
  const p = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  return p === "llama" || p === "groq" || p === "ollama" || p === "openai";
}
