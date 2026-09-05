import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    const messages = await db.select().from(chatMessages).where(eq(chatMessages.session_id, parseInt(sessionId))).orderBy(chatMessages.created_at);
    const session = await db.select().from(chatSessions).where(eq(chatSessions.id, parseInt(sessionId))).then((r) => r[0]);
    return NextResponse.json({ session, messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
