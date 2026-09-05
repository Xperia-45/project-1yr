import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, documentChunks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { retrieveChunks } from "@/lib/rag";

export async function GET(req: NextRequest, { params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  try {
    const subj = await db.select().from(subjects).where(eq(subjects.id, parseInt(subjectId))).then((r) => r[0]);
    if (!subj) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    // Retrieve a broad set of chunks to synthesize revision notes
    const chunks = await retrieveChunks("key definitions formulas important concepts common mistakes likely questions", parseInt(subjectId), 8);
    const definitions: string[] = [];
    const formulas: string[] = [];
    const concepts: string[] = [];

    for (const c of chunks) {
      const lines = c.content.split(/\n/).filter((l) => l.trim().length > 10);
      for (const line of lines) {
        const l = line.trim();
        if (/defin|meaning|is a |refers to/i.test(l) && l.length < 300) definitions.push(l);
        if (/[=+\-/*^()]|formula|equation|calculation/i.test(l) && l.length < 300) formulas.push(l);
        if (l.length > 20 && l.length < 200 && !definitions.includes(l) && !formulas.includes(l)) concepts.push(l);
      }
    }

    const uniqueDefs = [...new Set(definitions)].slice(0, 10);
    const uniqueFormulas = [...new Set(formulas)].slice(0, 10);
    const uniqueConcepts = [...new Set(concepts)].slice(0, 10);

    return NextResponse.json({
      subject: subj,
      revision: {
        key_definitions: uniqueDefs,
        formulas: uniqueFormulas,
        concepts: uniqueConcepts,
        likely_questions: [`What is ${subj.name} and why is it important?`, `Explain the key process/module in ${subj.name}.`, `Compare different types/concepts in ${subj.name}.`],
        sources: chunks.map((c) => ({ filename: c.document_filename, page: c.page_number, preview: c.content.slice(0, 120) + "..." })),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
