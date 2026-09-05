import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, documentChunks, subjects } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
// using crypto.randomUUID
import { extractTextFromFile } from "@/lib/extraction";
import { splitIntoChunks } from "@/lib/chunking";
import { embedBatch } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const subjectIdStr = formData.get("subject_id") as string;
    const subjectId = parseInt(subjectIdStr || "0");
    if (!file || !subjectId) return NextResponse.json({ error: "File and subject_id required" }, { status: 400 });

    // Save to temp
    const tmpDir = "/tmp/examnight-uploads";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, `${crypto.randomUUID()}-${file.name}`);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(tmpPath, Buffer.from(bytes));

    // Insert document with uploading status
    const [doc] = await db.insert(documents).values({
      subject_id: subjectId,
      user_id: 1,
      filename: file.name,
      file_type: file.type || "application/pdf",
      file_size: bytes.byteLength,
      processing_status: "extracting",
    }).returning();

    // Update status to processing
    await db.update(documents).set({ processing_status: "processing" }).where(eq(documents.id, doc.id));

    const extracted = await extractTextFromFile(tmpPath, file.type || "application/pdf");
    if (extracted.error || !extracted.text) {
      await db.update(documents).set({ processing_status: "failed", text_content: extracted.error || "No text extracted" }).where(eq(documents.id, doc.id));
      fs.unlinkSync(tmpPath);
      return NextResponse.json({ error: "Extraction failed: " + (extracted.error || "empty"), document_id: doc.id }, { status: 400 });
    }

    await db.update(documents).set({ text_content: extracted.text, page_count: extracted.pageCount, processing_status: "indexing" }).where(eq(documents.id, doc.id));

    const chunks = splitIntoChunks(extracted.text, { chunkSize: 900, overlap: 150, pageNumber: 1 });
    const texts = chunks.map((c) => c.content);
    const embeddings = await embedBatch(texts);

    // Insert chunks
    for (let i = 0; i < chunks.length; i++) {
      await db.insert(documentChunks).values({
        document_id: doc.id,
        subject_id: subjectId,
        content: chunks[i].content,
        embedding: embeddings[i] as any,
        page_number: chunks[i].pageNumber,
        chunk_index: chunks[i].chunkIndex,
        metadata: { file: file.name, type: file.type },
      });
    }

    await db.update(documents).set({ processing_status: "ready", chunk_count: chunks.length, updated_at: new Date() }).where(eq(documents.id, doc.id));

    fs.unlinkSync(tmpPath);
    return NextResponse.json({ document: { ...doc, processing_status: "ready", chunk_count: chunks.length }, chunks: chunks.length });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}
