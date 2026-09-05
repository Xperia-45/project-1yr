import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, documentChunks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(documentChunks).where(eq(documentChunks.document_id, parseInt(id)));
    await db.delete(documents).where(eq(documents.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
