import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, chatMessages, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { retrieveChunks } from "@/lib/rag";
import { synthesizeAnswer } from "@/lib/synthesize";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, subjectId, materialOnly = true } = body;
    if (!message || !subjectId) return NextResponse.json({ error: "message and subjectId required" }, { status: 400 });

    let session = sessionId ? await db.select().from(chatSessions).where(eq(chatSessions.id, parseInt(sessionId))).then((r) => r[0]) : null;
    if (!session) {
      const [newSess] = await db.insert(chatSessions).values({ user_id: 1, subject_id: parseInt(subjectId), title: message.slice(0, 60) }).returning();
      session = newSess;
    }

    // Retrieve from user's material
    const chunks = await retrieveChunks(message, parseInt(subjectId), 6);
    const synthesis = synthesizeAnswer(message, chunks, { materialOnly, tone: "clear" });

    // Save user message
    await db.insert(chatMessages).values({ session_id: session.id, role: "user", content: message, sources_json: [] });
    // Save assistant message with sources
    await db.insert(chatMessages).values({ session_id: session.id, role: "assistant", content: synthesis.answer, sources_json: synthesis.sources });

    return NextResponse.json({
      answer: synthesis.answer,
      sources: synthesis.sources,
      sessionId: session.id,
      insufficiency: synthesis.insufficiency,
      chunksRetrieved: chunks.length,
    });
  } catch (e: any) {
    console.error("Chat error:", e);
    return NextResponse.json({ error: e.message || "Chat failed" }, { status: 500 });
  }
}
