export const runtime = "nodejs";

import { synthesizeChunk } from "@/lib/elevenlabs";

function splitIntoChunks(script: string, maxChars = 4800): string[] {
  const paragraphs = script.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? current + "\n\n" + para : para;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      // If a single paragraph exceeds limit, hard-split it
      if (para.length > maxChars) {
        for (let i = 0; i < para.length; i += maxChars) {
          chunks.push(para.slice(i, i + maxChars));
        }
        current = "";
      } else {
        current = para;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export async function POST(request: Request) {
  const { script } = (await request.json()) as { script: string };

  if (!script || typeof script !== "string") {
    return new Response("Missing script", { status: 400 });
  }

  const chunks = splitIntoChunks(script);

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for (const chunk of chunks) {
          const buf = await synthesizeChunk(chunk);
          controller.enqueue(new Uint8Array(buf));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
