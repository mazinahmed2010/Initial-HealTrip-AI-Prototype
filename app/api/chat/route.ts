import { NextResponse } from "next/server";
import { z } from "zod";
import { runAssistant } from "@/lib/ai";

const Turn = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
  stage: z.enum(["clarification", "safety", "recommendation", "provider_search", "response"]).optional()
});

const Body = z.object({
  message: z.string().trim().min(2).max(4000),
  history: z.array(Turn).max(12).optional()
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = Body.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid message." },
        { status: 400 }
      );
    }

    const result = await runAssistant(parsed.data.message, parsed.data.history ?? []);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "The assistant could not process this request." },
      { status: 500 }
    );
  }
}
