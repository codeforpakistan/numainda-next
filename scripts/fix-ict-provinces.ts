import { db } from '../lib/db/index'
import { representatives } from '../lib/db/schema/representatives'
import { like, or } from 'drizzle-orm'

async function fixICTProvinces() {
  console.log('Fixing ICT constituency provinces...')

  // Update all ICT constituencies from "Khyber Pukhtunkhwa" to "Islamabad Capital Territory"
  const result = await db
    .update(representatives)
    .set({ province: 'Islamabad Capital Territory' })
    .where(
      or(
        like(representatives.constituency, '%ICT%'),
        like(representatives.district, '%ICT%')
      )
    )

  console.log('Updated representatives:', result.rowCount)

  // Verify the fix
  const ictReps = await db
    .select({
      name: representatives.name,
      constituency: representatives.constituency,
      province: representatives.province,
      district: representatives.district
    })
    .from(representatives)
    .where(like(representatives.constituency, '%ICT%'))

  console.log('\nICT Representatives after fix:')
  ictReps.forEach(rep => {
    console.log(`- ${rep.constituency} | ${rep.province} | ${rep.name}`)
  })

  process.exit(0)
}

fixICTProvinces().catch(console.error)
