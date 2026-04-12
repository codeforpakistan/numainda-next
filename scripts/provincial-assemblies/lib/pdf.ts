import fs from "fs";
// @ts-expect-error - pdf-parse has no types shipped by default
import pdfParse from "pdf-parse";

export async function readPdfText(filePath: string): Promise<string> {
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf);
  return data.text as string;
}

/**
 * Split pdf text into member blocks on lines beginning with "N. Name:".
 * Returns [{ sequenceNumber, block }, ...].
 */
export function splitMemberBlocks(
  text: string,
): { sequenceNumber: number; block: string }[] {
  const rx = /^\s*(\d+)\.\s*Name:\s*/m;
  const lines = text.split("\n");
  const blocks: { sequenceNumber: number; block: string }[] = [];
  let current: { sequenceNumber: number; lines: string[] } | null = null;

  for (const line of lines) {
    const m = /^\s*(\d+)\.\s*Name:\s*(.*)$/.exec(line);
    if (m) {
      if (current) blocks.push({ sequenceNumber: current.sequenceNumber, block: current.lines.join("\n") });
      current = { sequenceNumber: parseInt(m[1], 10), lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push({ sequenceNumber: current.sequenceNumber, block: current.lines.join("\n") });
  void rx;
  return blocks;
}

export function pickField(block: string, label: string): string | null {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // `[ \t]*` (not `\s*`) so a blank "Foo:" line doesn't swallow the next one.
  const rx = new RegExp(`^[ \\t]*${esc}:[ \\t]*(.*)$`, "m");
  const m = rx.exec(block);
  if (!m) return null;
  const val = m[1].trim();
  return val.length === 0 ? null : val;
}
