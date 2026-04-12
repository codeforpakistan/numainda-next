import fs from "fs";
import path from "path";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWORDS = new Set(["mr", "ms", "mrs", "dr", "capt", "col", "r"]);

export function listImageFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()));
}

/**
 * Match a member name to a file. Strategy:
 *   1. Tokenize both sides, drop stopwords.
 *   2. Score = tokens matching in file stem (substring), with tie-break by
 *      positional agreement + stem length closeness.
 *   3. Truncated filenames like "Makhdoom_Zada_Muhammad_Aftab_H.jpg" still
 *      match because we only require name tokens to be prefix-substrings of
 *      file tokens.
 */
export function matchImage(
  memberName: string,
  files: string[],
  used?: Set<string>,
): string | null {
  const nameTokens = tokenize(memberName).filter((t) => !STOPWORDS.has(t));
  if (nameTokens.length === 0) return null;

  let best: { file: string; score: number } | null = null;

  for (const file of files) {
    if (used && used.has(file)) continue;
    const stemTokens = tokenize(path.parse(file).name).filter(
      (t) => !STOPWORDS.has(t),
    );
    if (stemTokens.length === 0) continue;

    let hits = 0;
    for (const nt of nameTokens) {
      const found = stemTokens.some(
        (st) => st === nt || st.startsWith(nt) || nt.startsWith(st),
      );
      if (found) hits++;
    }

    // require majority of name tokens to match
    if (hits < Math.ceil(nameTokens.length * 0.6)) continue;

    // prefer higher hit count, then closer token-count, then shorter stem
    const score =
      hits * 1000 - Math.abs(stemTokens.length - nameTokens.length) * 10 - stemTokens.length;

    if (!best || score > best.score) best = { file, score };
  }

  return best ? best.file : null;
}
