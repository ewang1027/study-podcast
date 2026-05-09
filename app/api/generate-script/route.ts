export const runtime = "nodejs";

import { anthropic, buildSystemPrompt } from "@/lib/claude";
import { extractTextFromPDF } from "@/lib/pdf";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response("No file provided", { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let rawText: string;
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    rawText = await extractTextFromPDF(buffer);
  } else {
    rawText = buffer.toString("utf-8");
  }

  const inputText = rawText.slice(0, 15000);

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: buildSystemPrompt("teacher"),
    messages: [
      {
        role: "user",
        content: `Here is the study material. Convert it into a podcast-style narration:\n\n${inputText}`,
      },
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
