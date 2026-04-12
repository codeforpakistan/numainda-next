// Only true titles. Tribal/ethnic prefixes like Sardar, Nawab, Mir, Malik,
// Khan, Syed, Makhdoom etc. are part of names and must be kept.
const HONORIFICS = new Set([
  "mr", "ms", "mrs", "miss",
  "dr", "prof", "professor",
  "capt", "captain", "col", "colonel", "major", "maj",
  "general", "gen", "lt", "brig", "engineer", "engr",
  "advocate", "adv",
  "r", "retd",
]);

export function stripHonorifics(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+/)
    .filter((token) => {
      const t = token.replace(/[.,]/g, "").toLowerCase();
      return t.length > 0 && !HONORIFICS.has(t);
    })
    .join(" ")
    .trim();
}

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function filenameSlug(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "_");
}
