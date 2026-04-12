/**
 * Extract Sindh Assembly members from the source PDF.
 *
 * NOTE: The source PDF labels every member "Seat Type: General" even for
 * reserved-seat MPAs. Per user decision we accept seatType='general' across
 * the board and flag it in provenanceNote so this can be re-ingested later
 * from a better source.
 *
 * Usage: npx tsx scripts/provincial-assemblies/extract-sindh.ts
 */
import fs from "fs";
import path from "path";
import { readPdfText, splitMemberBlocks, pickField } from "./lib/pdf";
import { normalizeParty } from "./lib/party-normalize";
import { stripHonorifics } from "./lib/slugify";
import { listImageFiles, matchImage } from "./lib/match-image";
import type { ProvincialMember } from "./lib/types";

const SOURCE_DIR = path.resolve("data/provincial assemblies/sindh");
const PDF_PATH = path.join(SOURCE_DIR, "sindh_assembly_members.pdf");
const OUT_PATH = path.join(SOURCE_DIR, "members.json");

function parseConstituency(raw: string | null): {
  code: string | null;
  name: string | null;
  district: string | null;
} {
  if (!raw) return { code: null, name: null, district: null };
  const m = /^PS-(\d+)(?:\s+(.*))?$/.exec(raw.trim());
  if (!m) throw new Error(`Sindh: unparseable constituency "${raw}"`);
  const [, num, tail] = m;
  const code = `PS-${num}`;
  const name = tail?.trim() || null;
  const district = name ? name.replace(/-[IVX]+$/i, "").trim() : null;
  return { code, name, district };
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
    if (!name) throw new Error(`Sindh block ${sequenceNumber}: no name`);

    const partyRaw = pickField(block, "Party") ?? "";
    if (!partyRaw) throw new Error(`Sindh block ${sequenceNumber}: no party`);

    const { code, name: cn, district } = parseConstituency(
      pickField(block, "Constituency"),
    );

    const nameClean = stripHonorifics(name);
    const imgFile = matchImage(name, files, usedImages);
    if (imgFile) {
      matched++;
      usedImages.add(imgFile);
    }

    members.push({
      assembly: "sindh",
      province: "Sindh",
      sequenceNumber,
      name,
      nameClean,
      fatherName: null,
      party: partyRaw,
      partyCode: normalizeParty(partyRaw),
      seatType: "general",
      constituencyCode: code,
      constituencyName: cn,
      district,
      email: pickField(block, "Email"),
      phone: null,
      facebookHandle: null,
      age: null,
      oathTakingDate: null,
      profileUrl: null,
      profileSourceId: null,
      imageSourcePath: imgFile ? path.join(SOURCE_DIR, imgFile) : null,
      imageLocalPath: null,
      provenanceNote:
        "Source PDF labels all members seatType='General'; women/minority reserved seats not distinguished. Re-ingest from authoritative source to recover real seat types.",
    });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(members, null, 2));

  const withCode = members.filter((m) => m.constituencyCode).length;
  console.log(`Sindh: wrote ${members.length} members → ${OUT_PATH}`);
  console.log(`  with constituency code: ${withCode}/${members.length}`);
  console.log(`  images matched: ${matched}/${members.length}`);
  console.log(`  source images available: ${files.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
