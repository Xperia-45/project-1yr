import { db } from "@/db";
import { documentChunks } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { embedText } from "./embeddings";

export interface RetrievedChunk {
  id: number;
  content: string;
  document_id: number;
  document_filename: string;
  page_number?: number | null;
  chunk_index: number;
  section_title?: string | null;
  similarity: number;
}

export async function retrieveChunks(query: string, subjectId: number, topK = 6): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(query);
  // Use raw SQL with cosine_similarity function on array embeddings
  const result = await db.execute(sql`
    SELECT 
      dc.id,
      dc.content,
      dc.document_id,
      d.filename as document_filename,
      dc.page_number,
      dc.chunk_index,
      dc.section_title,
      cosine_similarity(dc.embedding, ${queryEmbedding}::real[]) as similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE dc.subject_id = ${subjectId}
    ORDER BY cosine_similarity(dc.embedding, ${queryEmbedding}::real[]) DESC
    LIMIT ${topK}
  `);

  const resultRows = (result as any).rows || [];
  const results: RetrievedChunk[] = (resultRows as any[]).map((r: any) => ({
    id: r.id,
    content: r.content,
    document_id: r.document_id,
    document_filename: r.document_filename,
    page_number: r.page_number,
    chunk_index: r.chunk_index,
    section_title: r.section_title,
    similarity: parseFloat(r.similarity || 0),
  }));
  return results;
}
