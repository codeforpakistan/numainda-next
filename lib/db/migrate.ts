import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { env } from "@/lib/env.mjs"

const runMigrate = async () => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined")
  }

  const connection = postgres(env.DATABASE_URL, { max: 1 })

  const db = drizzle(connection)

  const hostname = new URL(env.DATABASE_URL).hostname
  const local =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "postgres"
  console.log(`⏳ Running migrations against ${hostname}`)
  if (!local) {
    console.log(
      "This host is not the local compose database. Stop if that is not the database you mean to change."
    )
  }

  const start = Date.now()

  await migrate(db, { migrationsFolder: "lib/db/migrations" })

  const end = Date.now()

  console.log("✅ Migrations completed in", end - start, "ms")

  process.exit(0)
}

runMigrate().catch((err) => {
  console.error("❌ Migration failed")
  console.error(err)
  process.exit(1)
})
