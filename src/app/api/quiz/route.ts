import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, documentChunks, quizSessions, quizQuestions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { retrieveChunks } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectId, mode = "quick" } = body;
    const count = mode === "quick" ? 5 : mode === "exam" ? 15 : 30;
    const subj = await db.select().from(subjects).where(eq(subjects.id, parseInt(subjectId))).then((r) => r[0]);
    if (!subj) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const chunks = await retrieveChunks("important concepts definitions process steps examples", parseInt(subjectId), 5);
    const session = await db.insert(quizSessions).values({ user_id: 1, subject_id: parseInt(subjectId), mode, total: count }).returning().then((r) => r[0]);

    const questions = [];
    const types = ["mcq", "true_false", "short_answer"];
    for (let i = 0; i < count; i++) {
      const chunk = chunks[i % chunks.length];
      const text = chunk?.content?.slice(0, 600) || "Study material content";
      const qText = `Based on your notes (${chunk?.document_filename || "notes"}): ${text.split(/\.|\n/)[0]}?`;
      const correct = text.split(/\.|\n/)[0] || "Review your notes";
      const explanation = `According to your uploaded material (${chunk?.document_filename || "notes"}${chunk?.page_number ? ` Page ${chunk.page_number}` : ""}): ${correct}.`;
      const opts = types[i % 3] === "mcq" ? ["Option A", "Option B", "Option C", "Option D"] : [];
      questions.push({
        session_id: session.id,
        question_text: qText,
        options_json: opts,
        correct_answer: correct.slice(0, 200),
        explanation,
        source_refs: [{ filename: chunk?.document_filename, page: chunk?.page_number, preview: text.slice(0, 120) }],
      });
    }
    await db.insert(quizQuestions).values(questions);
    return NextResponse.json({ session, questions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
