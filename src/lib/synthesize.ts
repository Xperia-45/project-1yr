import { RetrievedChunk } from "./rag";

export interface SourceRef {
  document_filename: string;
  page_number?: number | null;
  chunk_index: number;
  content_preview: string;
}

export function synthesizeAnswer(query: string, chunks: RetrievedChunk[], options?: { materialOnly?: boolean; tone?: string }): { answer: string; sources: SourceRef[]; insufficiency: boolean } {
  if (chunks.length === 0) {
    return {
      answer: "I couldn't find enough information about this in your uploaded material. Try uploading more notes or asking a more specific question related to your documents.",
      sources: [],
      insufficiency: true,
    };
  }

  // Build answer grounded in chunks
  const sources: SourceRef[] = chunks.map((c) => ({
    document_filename: c.document_filename,
    page_number: c.page_number,
    chunk_index: c.chunk_index,
    content_preview: c.content.slice(0, 180) + (c.content.length > 180 ? "..." : ""),
  }));

  // Aggregate relevant content from chunks
  const relevantText = chunks.map((c) => `--- From "${c.document_filename}"${c.page_number ? ` (Page ${c.page_number})` : ""} ---\n${c.content}`).join("\n\n");

  let answer = "";
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("explain") || lowerQuery.includes("what is") || lowerQuery.includes("define")) {
    answer = `Based on your study material:\n\n${relevantText.slice(0, 3000)}`;
    if (relevantText.length > 3000) answer += "\n\n[More details available in your notes — ask for a specific module or topic.]";
  } else if (lowerQuery.includes("formula") || lowerQuery.includes("equation") || lowerQuery.includes("calculate")) {
    const formulaLines = chunks.flatMap((c) => c.content.split(/\n/)).filter((l) => /[=+\-/*^()]/.test(l) || l.toLowerCase().includes("formula") || l.toLowerCase().includes("equation") || l.toLowerCase().includes("calculation"));
    const formulas = [...new Set(formulaLines)].slice(0, 8);
    answer = `According to your notes, relevant formulas/equations include:\n\n${formulas.join("\n\n") || relevantText.slice(0, 2000)}`;
  } else if (lowerQuery.includes("quiz") || lowerQuery.includes("question") || lowerQuery.includes("test me")) {
    answer = `From your uploaded material:\n\n${relevantText.slice(0, 3000)}\n\nConsider reviewing key definitions and steps to prepare for questions on this topic.`;
  } else if (lowerQuery.includes("important") || lowerQuery.includes("priority") || lowerQuery.includes("must study")) {
    answer = `Based on your documents, the most relevant sections are:\n\n${relevantText.slice(0, 3000)}`;
  } else {
    answer = `According to your study material (${chunks[0]?.document_filename || "your notes"}):\n\n${relevantText.slice(0, 3000)}`;
    if (relevantText.length > 3000) answer += "\n\n[Continue reading your notes for more detail.]";
  }

  // If chunks have very low similarity overall (< 0.3 average) and query is broad, flag insufficiency
  const avgSim = chunks.reduce((s, c) => s + c.similarity, 0) / chunks.length;
  const insufficiency = avgSim < 0.35 && chunks.length < 3;

  if (insufficiency) {
    answer += "\n\nNote: The retrieved sections from your material are somewhat limited for this specific question. Consider uploading more detailed notes or asking about a specific module.";
  }

  return { answer, sources, insufficiency };
}
