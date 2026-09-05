export interface Chunk {
  content: string;
  pageNumber?: number;
  chunkIndex: number;
  sectionTitle?: string;
  metadata: Record<string, any>;
}

export function splitIntoChunks(text: string, options?: { chunkSize?: number; overlap?: number; pageNumber?: number }): Chunk[] {
  const chunkSize = options?.chunkSize ?? 1000;
  const overlap = options?.overlap ?? 150;
  const chunks: Chunk[] = [];
  const cleaned = text.replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  let start = 0;
  let idx = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const content = words.slice(start, end).join(" ");
    chunks.push({
      content,
      pageNumber: options?.pageNumber,
      chunkIndex: idx++,
      sectionTitle: undefined,
      metadata: {},
    });
    start = end - overlap;
    if (start <= 0) start = end;
  }
  return chunks;
}
