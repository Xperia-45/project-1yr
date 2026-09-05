import { pipeline } from "@xenova/transformers";

let extractorPromise: Promise<any> | null = null;

export async function getEmbedder() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2") as any;
  }
  return extractorPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getEmbedder();
  const result = await extractor(text, { pooling: "mean", normalize: true });
  // result can be Tensor or array of floats
  const arr = result.data ? Array.from(result.data as Float32Array) : Array.from(result[0] as Float32Array);
  return arr.map((v) => Math.round(v * 1e6) / 1e6); // normalize precision
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const extractor = await getEmbedder();
  const results = await extractor(texts, { pooling: "mean", normalize: true });
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    const data = results[i]?.data ? Array.from(results[i].data as Float32Array) : Array.from(results[i] as Float32Array);
    out.push(data.map((v) => Math.round(v * 1e6) / 1e6));
  }
  return out;
}
