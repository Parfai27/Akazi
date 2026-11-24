const DEFAULT_MODEL = "openai/gpt-oss-20b";
const TIMEOUT_MS = 15_000;

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export function aiConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/**
 * Asks a Groq-hosted model for a JSON object that matches the schema.
 * Returns null when no key is set or the request fails, so callers can fall back to something else.
 */
export async function groqJson(
  messages: GroqMessage[],
  schema: { name: string; schema: Record<string, unknown> },
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<Record<string, unknown> | null> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
  // Strict schemas only work on some Groq models; the others get plain JSON mode.
  const strict = /^openai\/gpt-oss|^qwen\/qwen3\.8/.test(model);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.5,
        max_completion_tokens: options.maxTokens ?? 1024,
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
        response_format: strict
          ? { type: "json_schema", json_schema: { name: schema.name, strict: true, schema: schema.schema } }
          : { type: "json_object" },
      }),
    });
    if (!response.ok) {
      console.error(`AI request failed: ${response.status} ${(await response.text()).slice(0, 300)}`);
      return null;
    }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "") as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch (error) {
    console.error("AI request failed", error instanceof Error ? error.message : error);
    return null;
  }
}

const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 20;
const recentByVisitor = new Map<string, number[]>();

/** Keeps one visitor from using up the free AI quota: 20 AI answers per 10 minutes. */
export function allowAi(request: Request) {
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const times = (recentByVisitor.get(visitor) ?? []).filter((time) => now - time < WINDOW_MS);
  if (times.length >= PER_WINDOW) {
    recentByVisitor.set(visitor, times);
    return false;
  }
  times.push(now);
  recentByVisitor.set(visitor, times);
  if (recentByVisitor.size > 5000) recentByVisitor.clear();
  return true;
}
