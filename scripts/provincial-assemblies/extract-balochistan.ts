/**
 * Extract Balochistan Assembly members from the source PDF.
 *
 * Usage: npx tsx scripts/provincial-assemblies/extract-balochistan.ts
 */
import fs from "fs";
import path from "path";
import { readPdfText, splitMemberBlocks, pickField } from "./lib/pdf";
import { normalizeParty } from "./lib/party-normalize";
import { stripHonorifics } from "./lib/slugify";
import { listImageFiles, matchImage } from "./lib/match-image";
import type { ProvincialMember, SeatType } from "./lib/types";

const SOURCE_DIR = path.resolve("data/provincial assemblies/balochistan");
const PDF_PATH = path.join(SOURCE_DIR, "balochistan_assembly_members.pdf");
const OUT_PATH = path.join(SOURCE_DIR, "members.json");

function parseSeatType(raw: string | null): SeatType {
  if (!raw) return "general";
  const s = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (s === "elected") return "general";
  if (s.includes("women")) return "women_reserved";
  if (s.includes("minorit")) return "minority_reserved";
  throw new Error(`Balochistan: unknown seat type "${raw}"`);
}

function parseOathDate(raw: string | null): string | null {
  if (!raw) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function extractProfileId(url: string | null): string | null {
  if (!url) return null;
  const m = /member-profile\/(\d+)/.exec(url);
  return m ? m[1] : null;
}

async function main() {
  const text = await readPdfText(PDF_PATH);
  const blocks = splitMemberBlocks(text);
  const files = listImageFiles(SOURCE_DIR);

  const members: ProvincialMember[] = [];
  const usedImages = new Set<string>();
  let matched = 0;

  for (const { sequenceNumber, block } of blocks) {
    const nameLine = /^\s*\d+\.\s*Name:\s*(.*)$/m.exec(block);
    const name = nameLine?.[1].trim() ?? "";
    if (!name) throw new Error(`Balochistan block ${sequenceNumber}: no name`);

    const partyRaw = pickField(block, "Party") ?? "";
    if (!partyRaw)
      throw new Error(`Balochistan block ${sequenceNumber}: no party`);

    const seatType = parseSeatType(pickField(block, "Seat Type"));
    const profileUrl = pickField(block, "Profile");
    const nameClean = stripHonorifics(name);
    const imgFile = matchImage(name, files, usedImages);
    if (imgFile) {
      matched++;
      usedImages.add(imgFile);
    }

    members.push({
      assembly: "balochistan",
      province: "Balochistan",
      sequenceNumber,
      name,
      nameClean,
      fatherName: pickField(block, "Father Name"),
      party: partyRaw,
      partyCode: normalizeParty(partyRaw),
      seatType,
      constituencyCode: null,
      constituencyName: null,
      district: null,
      email: pickField(block, "Email"),
      phone: pickField(block, "Phone"),
      facebookHandle: pickField(block, "Facebook"),
      age: null,
      oathTakingDate: parseOathDate(pickField(block, "Oath Date")),
      profileUrl,
      profileSourceId: extractProfileId(profileUrl),
      imageSourcePath: imgFile ? path.join(SOURCE_DIR, imgFile) : null,
      imageLocalPath: null,
      provenanceNote:
        "Constituency code not provided in source PDF; left null.",
    });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(members, null, 2));

  const byType = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.seatType] = (acc[m.seatType] || 0) + 1;
    return acc;
  }, {});

  console.log(`Balochistan: wrote ${members.length} members → ${OUT_PATH}`);
  console.log(`  seatType:`, byType);
  console.log(`  images matched: ${matched}/${members.length}`);
  console.log(`  source images available: ${files.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
