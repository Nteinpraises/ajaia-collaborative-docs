import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function summarizeText(text: string) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI is not configured (missing LOVABLE_API_KEY)");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      if (!res.ok) {
        const body = await res.clone().text();
        if (res.status === 402) throw new Error("AI credits are exhausted. Add credits to continue.");
        if (res.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
        throw new Error(`AI request failed [${res.status}]: ${body.slice(0, 300)}`);
      }
      return res;
    },
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system:
      "You summarize documents. Write a concise, accurate summary (3-6 sentences or a short bullet list) in plain text. Do not invent facts.",
    prompt: text,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const out = await result.text;
  if (failure) throw failure instanceof Error ? failure : new Error("AI request failed");
  if (!out.trim()) throw new Error("The model returned no summary.");
  return out.trim();
}
