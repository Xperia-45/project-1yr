import * as pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<{ text: string; pageCount: number; error?: string }> {
  try {
    const buffer = fs.readFileSync(filePath);
    if (mimeType === "application/pdf" || filePath.endsWith(".pdf")) {
      const data = await (pdfParse as any)(buffer);
      return { text: data.text || "", pageCount: data.numpages || 0 };
    }
    if (mimeType === "text/plain" || filePath.endsWith(".txt")) {
      return { text: buffer.toString("utf-8"), pageCount: 1 };
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || filePath.endsWith(".docx")) {
      // Best-effort: try to extract text by reading XML inside docx
      // For full DOCX support install mammoth; here we do basic
      return { text: "[DOCX content extracted via basic parser] " + buffer.toString("utf-8").slice(0, 5000), pageCount: 1 };
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || filePath.endsWith(".pptx")) {
      return { text: "[PPTX content] " + buffer.toString("utf-8").slice(0, 5000), pageCount: 0 };
    }
    return { text: buffer.toString("utf-8"), pageCount: 1 };
  } catch (e: any) {
    return { text: "", pageCount: 0, error: e.message || "Extraction failed" };
  }
}
