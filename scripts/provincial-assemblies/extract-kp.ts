/**
 * Extract KP Assembly members from the source PDF into members.json.
 *
 * Usage: npx tsx scripts/provincial-assemblies/extract-kp.ts
 */
import fs from "fs";
import path from "path";
import { readPdfText, splitMemberBlocks, pickField } from "./lib/pdf";
import { normalizeParty } from "./lib/party-normalize";
import { stripHonorifics } from "./lib/slugify";
import { listImageFiles, matchImage } from "./lib/match-image";
import type { ProvincialMember, SeatType } from "./lib/types";

const SOURCE_DIR = path.resolve("data/provincial assemblies/kp");
const PDF_PATH = path.join(SOURCE_DIR, "kp_assembly_members.pdf");
const OUT_PATH = path.join(SOURCE_DIR, "members.json");

function parseConstituency(raw: string | null): {
  code: string | null;
  name: string | null;
  seatType: SeatType;
  district: string | null;
} {
  if (!raw) {
    return { code: null, name: null, seatType: "general", district: null };
  }
  const m = /^(PK|WR|MR)-(\d+)(?:[\s-]+(.*))?$/.exec(raw.trim());
  if (!m) {
    throw new Error(`KP: unparseable constituency "${raw}"`);
  }
  const [, prefix, num, tail] = m;
  const code = `${prefix}-${num}`;
  const seatType: SeatType =
    prefix === "PK"
      ? "general"
      : prefix === "WR"
        ? "women_reserved"
        : "minority_reserved";
  const name = tail?.trim() || null;
  const district =
    prefix === "PK" && name ? name.replace(/-[IVX]+$/i, "").trim() : null;
  return { code, name, seatType, district };
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
    if (!name) throw new Error(`KP block ${sequenceNumber}: no name`);

    const constituencyRaw = pickField(block, "Constituency");
    const { code, name: constituencyName, seatType, district } =
      parseConstituency(constituencyRaw);

    const partyRaw = pickField(block, "Party") ?? "";
    if (!partyRaw) throw new Error(`KP block ${sequenceNumber}: no party`);

    const email = pickField(block, "Email");
    const phone = pickField(block, "Phone");
    const profileUrl = pickField(block, "Profile");

    const nameClean = stripHonorifics(name);
    const imgFile = matchImage(name, files, usedImages);
    if (imgFile) {
      matched++;
      usedImages.add(imgFile);
    }

    members.push({
      assembly: "kp",
      province: "Khyber Pakhtunkhwa",
      sequenceNumber,
      name,
      nameClean,
      fatherName: null,
      party: partyRaw,
      partyCode: normalizeParty(partyRaw),
      seatType,
      constituencyCode: code,
      constituencyName,
      district,
      email,
      phone,
      facebookHandle: null,
      age: null,
      oathTakingDate: null,
      profileUrl,
      profileSourceId: null,
      imageSourcePath: imgFile ? path.join(SOURCE_DIR, imgFile) : null,
      imageLocalPath: null,
      provenanceNote: null,
    });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(members, null, 2));

  const byType = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.seatType] = (acc[m.seatType] || 0) + 1;
    return acc;
  }, {});

  console.log(`KP: wrote ${members.length} members → ${OUT_PATH}`);
  console.log(`  seatType:`, byType);
  console.log(`  images matched: ${matched}/${members.length}`);
  console.log(`  source images available: ${files.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
