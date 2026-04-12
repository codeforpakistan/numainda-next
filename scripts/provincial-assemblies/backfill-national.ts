/**
 * One-shot backfill for existing NA rows after the provincial schema migration:
 * sets assembly='national', seatType='general', populates partyCode from party.
 *
 * Safe to re-run (only updates rows where party_code is null).
 */
import { db } from "@/lib/db";
import { representatives } from "@/lib/db/schema/representatives";
import { eq, isNull, sql } from "drizzle-orm";
import { tryNormalizeParty } from "./lib/party-normalize";

async function main() {
  const rows = await db
    .select({ id: representatives.id, party: representatives.party })
    .from(representatives)
    .where(isNull(representatives.partyCode));

  console.log(`Backfilling ${rows.length} rows with null party_code`);

  const unknown = new Set<string>();
  let updated = 0;

  for (const row of rows) {
    const code = tryNormalizeParty(row.party);
    if (!code) {
      unknown.add(row.party);
      continue;
    }
    await db
      .update(representatives)
      .set({ partyCode: code })
      .where(eq(representatives.id, row.id));
    updated++;
  }

  // Ensure assembly/seatType defaults are applied on any preexisting row where
  // the column default wasn't picked up (null-safe because columns are NOT NULL
  // with defaults, but UPDATE when a value was set explicitly earlier).
  await db.execute(sql`
    UPDATE representatives
    SET assembly = 'national'
    WHERE assembly IS NULL OR assembly = ''
  `);
  await db.execute(sql`
    UPDATE representatives
    SET seat_type = 'general'
    WHERE seat_type IS NULL OR seat_type = ''
  `);

  console.log(`  updated party_code on ${updated} rows`);
  if (unknown.size > 0) {
    console.log(`  ⚠️  unmapped party strings (${unknown.size}):`);
    for (const p of unknown) console.log(`    - ${p}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
