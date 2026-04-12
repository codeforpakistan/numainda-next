/**
 * Seed provincial assembly members into the representatives table from the
 * extracted members.json files. Idempotent upsert keyed on
 * (assembly, constituencyCode) when a code exists, else on
 * (assembly, nameClean, sequenceNumber).
 *
 * Usage: npx tsx scripts/provincial-assemblies/seed.ts [kp|balochistan|sindh]
 */
import fs from "fs";
import path from "path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { representatives } from "@/lib/db/schema/representatives";
import type { Assembly, ProvincialMember } from "./lib/types";

const SOURCES: Record<Assembly, string> = {
  kp: "data/provincial assemblies/kp/members.json",
  balochistan: "data/provincial assemblies/balochistan/members.json",
  sindh: "data/provincial assemblies/sindh/members.json",
  // punjab: intentionally omitted — source PDF is partial
  punjab: "",
};

function buildConstituencyLabel(m: ProvincialMember): string {
  if (m.constituencyCode && m.constituencyName) {
    return `${m.constituencyCode} ${m.constituencyName}`;
  }
  if (m.constituencyCode) return m.constituencyCode;
  // Reserved seat without code (Balochistan) — synthesize a stable label
  return `${m.assembly.toUpperCase()}-${m.seatType}-${m.sequenceNumber}`;
}

async function findExisting(m: ProvincialMember) {
  if (m.constituencyCode) {
    const rows = await db
      .select({ id: representatives.id })
      .from(representatives)
      .where(
        and(
          eq(representatives.assembly, m.assembly),
          eq(representatives.constituencyCode, m.constituencyCode),
        ),
      )
      .limit(1);
    if (rows.length) return rows[0].id;
  }
  // fallback: (assembly, nameClean, sequenceNumber)
  const rows = await db
    .select({ id: representatives.id })
    .from(representatives)
    .where(
      and(
        eq(representatives.assembly, m.assembly),
        eq(representatives.nameClean, m.nameClean),
        eq(representatives.sequenceNumber, m.sequenceNumber),
      ),
    )
    .limit(1);
  return rows.length ? rows[0].id : null;
}

async function seedAssembly(assembly: Assembly): Promise<void> {
  const relPath = SOURCES[assembly];
  if (!relPath) {
    console.log(`${assembly}: skipped (no source)`);
    return;
  }
  const absPath = path.resolve(relPath);
  const members: ProvincialMember[] = JSON.parse(
    fs.readFileSync(absPath, "utf8"),
  );

  let inserted = 0;
  let updated = 0;

  for (const m of members) {
    const payload = {
      assembly: m.assembly,
      seatType: m.seatType,
      sequenceNumber: m.sequenceNumber,
      name: m.name,
      nameClean: m.nameClean,
      fatherName: m.fatherName,
      age: m.age,
      constituency: buildConstituencyLabel(m),
      constituencyCode: m.constituencyCode,
      constituencyName: m.constituencyName,
      district: m.district,
      province: m.province,
      party: m.party,
      partyCode: m.partyCode,
      oathTakingDate: m.oathTakingDate ? new Date(m.oathTakingDate) : null,
      email: m.email,
      phone: m.phone,
      facebookHandle: m.facebookHandle,
      profileUrl: m.profileUrl,
      profileSourceId: m.profileSourceId,
      imageLocalPath: m.imageLocalPath,
      provenanceNote: m.provenanceNote,
    };

    const existingId = await findExisting(m);
    if (existingId) {
      await db
        .update(representatives)
        .set({ ...payload, updatedAt: new Date() })
        .where(eq(representatives.id, existingId));
      updated++;
    } else {
      await db.insert(representatives).values(payload);
      inserted++;
    }
  }

  console.log(
    `${assembly}: inserted=${inserted} updated=${updated} total=${members.length}`,
  );
}

async function main() {
  const arg = process.argv[2] as Assembly | undefined;
  const targets: Assembly[] = arg
    ? [arg]
    : (["kp", "balochistan", "sindh"] as Assembly[]);

  for (const a of targets) {
    await seedAssembly(a);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
