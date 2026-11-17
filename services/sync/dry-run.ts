import {
  BULLETIN_PAGE_URL,
  ORDERS_PAGE_URL,
  formatReport,
  reportFromFiles,
  reportFromHtml,
} from "./report"

/**
 * Prints current-tenure orders and bulletins joined on the listing date.
 * It fetches the two listing pages, or reads HTML files the caller already has.
 * It does not download a PDF, write the database, or compile a decision.
 *
 *   tsx services/sync/dry-run.ts --orders orders.html --bulletins bulletins.html
 *   tsx services/sync/dry-run.ts --fetch
 */

function argValue(args: string[], name: string): string | null {
  const index = args.indexOf(name)
  if (index === -1) return null
  const value = args[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} needs a file path`)
  }
  return value
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "user-agent": "numainda-sync" },
    redirect: "follow",
  })
  if (!response.ok) {
    throw new Error(`GET ${url} returned ${response.status}`)
  }
  const type = response.headers.get("content-type") ?? ""
  if (type.includes("application/pdf")) {
    throw new Error(
      `GET ${url} returned a PDF. This command reads listing HTML only.`
    )
  }
  return response.text()
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(
      [
        "Print orders and bulletins joined on the date in the link text.",
        "",
        "  tsx services/sync/dry-run.ts --orders <file> --bulletins <file>",
        "  tsx services/sync/dry-run.ts --fetch",
        "",
        "Fetch uses the system trust store. It does not download PDFs.",
      ].join("\n")
    )
    if (args.length === 0) process.exitCode = 1
    return
  }

  const join = args.includes("--fetch")
    ? reportFromHtml(
        await fetchPage(ORDERS_PAGE_URL),
        await fetchPage(BULLETIN_PAGE_URL)
      )
    : reportFromFiles(
        argValue(args, "--orders") ?? missing("--orders"),
        argValue(args, "--bulletins") ?? missing("--bulletins")
      )

  process.stdout.write(formatReport(join))
}

function missing(name: string): never {
  throw new Error(`${name} is required unless --fetch is set`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
