import { db } from '../lib/db/index'
import { representatives } from '../lib/db/schema/representatives'

async function checkProvinces() {
  const allReps = await db
    .select({
      constituency: representatives.constituency,
      province: representatives.province,
      district: representatives.district,
      name: representatives.name
    })
    .from(representatives)

  // Group by province
  const byProvince: Record<string, number> = {}
  allReps.forEach(r => {
    const prov = r.province || 'NULL'
    byProvince[prov] = (byProvince[prov] || 0) + 1
  })

  console.log('Representatives by Province:')
  Object.entries(byProvince)
    .sort((a, b) => b[1] - a[1])
    .forEach(([prov, count]) => {
      console.log(`  ${prov}: ${count}`)
    })

  console.log('\nTotal:', allReps.length)

  process.exit(0)
}

checkProvinces().catch(console.error)
