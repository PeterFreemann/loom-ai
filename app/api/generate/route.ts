import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 300;

function friendlyError(err: unknown) {
  if (err instanceof Anthropic.APIError) {
    const msg = (err.error as { error?: { message?: string } } | undefined)?.error?.message ?? err.message;
    if (/credit balance/i.test(msg)) {
      return "Your Anthropic account has no API credits. Add credits under Billing at platform.claude.com, then try again.";
    }
    if (err.status === 401) return "Your ANTHROPIC_API_KEY was rejected. Check it in .env.local and restart the dev server.";
    if (err.status === 429) return "Too many requests right now. Wait a moment and try again.";
    return `Anthropic API: ${msg}`;
  }
  return err instanceof Error ? err.message : "Generation failed.";
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
      { status: 500 }
    );
  }

  const { prompt, currentHtml } = (await req.json()) as { prompt?: string; currentHtml?: string };
  if (!prompt?.trim()) return new Response("Describe the website you want first.", { status: 400 });

  const client = new Anthropic();

  // Awaiting create() makes errors like "no credits" or "bad key" throw here,
  // before streaming starts, so we can send the user a clear message.
  let events;
  try {
    events = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(prompt, currentHtml) }],
      stream: true,
    });
  } catch (err) {
    return new Response(friendlyError(err), { status: 502 });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      events.controller.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}