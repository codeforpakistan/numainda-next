/**
 * National Assembly listing parser.
 *
 * The Assembly publishes Orders of the Day and Daily Bulletins as PDF links
 * grouped into ARIA tabs, one tab per session. This module turns that markup
 * into listing records without downloading anything: it only reads the page
 * HTML the caller already has.
 *
 * Call it with a DOM available (Jest's jsdom environment provides
 * `DOMParser`); it performs no network access of its own.
 */

export type NaListingKind = "order" | "bulletin"

export interface NaListing {
  /** Chamber the listing belongs to. Only the National Assembly is parsed. */
  house: "national-assembly"
  /** Which Assembly page produced the record. */
  kind: NaListingKind
  /** Text of the `role="tab"` that labels the panel, or null when untabbed. */
  sessionLabel: string | null
  /** Date printed in the link text as YYYY-MM-DD, or null when absent/invalid. */
  listedOn: string | null
  /** Absolute URL of the PDF. */
  listingUrl: string
  /** PDF filename only, decoded, e.g. `ilovepdf_merged (1).pdf`. */
  filenameLabel: string
}

const NA_ORIGIN = "https://na.gov.pk"

const MONTH_NUMBERS: Record<string, number> = {}
const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]
for (const [index, name] of MONTH_NAMES.entries()) {
  MONTH_NUMBERS[name] = index + 1
  MONTH_NUMBERS[name.slice(0, 3)] = index + 1
}
MONTH_NUMBERS.sept = 9

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

/** Builds a YYYY-MM-DD string, or null when the calendar date does not exist. */
function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return `${String(year).padStart(4, "0")}-${pad2(month)}-${pad2(day)}`
}

/**
 * Reads the sitting date from link text.
 *
 * Accepted shapes include "Friday, the 23rd January, 2026" and "30-10-2026",
 * plus "Friday, 28th August, 2026", "January 23, 2026" and ISO dates. Returns
 * null rather than guessing: the caller gets a row with `listedOn: null`.
 */
export function parseListedOn(text: string | null | undefined): string | null {
  const value = normalizeText(text)
  if (!value) return null

  const iso = value.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
  if (iso) {
    return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  }

  // Day-first numeric dates, as printed on Assembly listings ("30-10-2026").
  const numeric = value.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/)
  if (numeric) {
    return toIsoDate(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]))
  }

  const dayFirst = value.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([A-Za-z]{3,})\.?,?\s+(\d{4})\b/
  )
  if (dayFirst) {
    const month = MONTH_NUMBERS[dayFirst[2].toLowerCase()]
    if (month) return toIsoDate(Number(dayFirst[3]), month, Number(dayFirst[1]))
  }

  const monthFirst = value.match(
    /\b([A-Za-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/
  )
  if (monthFirst) {
    const month = MONTH_NUMBERS[monthFirst[1].toLowerCase()]
    if (month)
      return toIsoDate(Number(monthFirst[3]), month, Number(monthFirst[2]))
  }

  return null
}

function resolveListingUrl(href: string, pageUrl: string): URL | null {
  const value = href.trim()
  if (!value) return null
  try {
    // Resolve against the Assembly origin so `../uploads/...` and
    // `/uploads/...` both land under https://na.gov.pk, never a foreign host.
    const page = new URL(pageUrl, `${NA_ORIGIN}/en/`)
    const base = new URL(page.pathname, NA_ORIGIN)
    const url = new URL(value, base)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url
  } catch {
    return null
  }
}

function pdfFilename(url: URL): string | null {
  const last = url.pathname.split("/").filter(Boolean).pop()
  if (!last) return null
  let decoded = last
  try {
    decoded = decodeURIComponent(last)
  } catch {
    // Keep the raw segment when it is not valid percent-encoding.
  }
  return decoded.toLowerCase().endsWith(".pdf") ? decoded : null
}

function kindForPage(pageUrl: string): NaListingKind {
  let pathname = pageUrl
  try {
    pathname = new URL(pageUrl, `${NA_ORIGIN}/en/`).pathname
  } catch {
    // Fall back to the raw string; the suffix check below is the contract.
  }
  const path = pathname.toLowerCase().replace(/\/+$/, "")
  if (path.endsWith("ordersoftheday.php")) return "order"
  if (path.endsWith("bulletin.php")) return "bulletin"
  throw new Error(
    `parseNaListings only handles ordersoftheday.php and bulletin.php pages, got: ${pageUrl}`
  )
}

function tabTextForPanel(
  panel: Element,
  doc: Document,
  tabs: Element[]
): string | null {
  const labelledBy = panel.getAttribute("aria-labelledby")
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/)) {
      const label = doc.getElementById(id)
      const text = normalizeText(label?.textContent)
      if (text) return text
    }
  }

  const panelId = panel.getAttribute("id")
  if (panelId) {
    for (const tab of tabs) {
      const controls = (tab.getAttribute("aria-controls") ?? "").split(/\s+/)
      if (controls.includes(panelId)) {
        const text = normalizeText(tab.textContent)
        if (text) return text
      }
    }
  }

  return null
}

/**
 * Parses a National Assembly Orders of the Day or Daily Bulletin page.
 *
 * Returns one record per PDF anchor inside a `role="tabpanel"`, in document
 * order. Anchors outside a tabpanel (site footer links, navigation) and
 * anchors that do not point at a PDF are ignored.
 *
 * @param html Page HTML.
 * @param pageUrl URL the HTML came from; decides `kind` and resolves links.
 */
export function parseNaListings(html: string, pageUrl: string): NaListing[] {
  const kind = kindForPage(pageUrl)

  const domParser = (
    globalThis as typeof globalThis & { DOMParser?: typeof DOMParser }
  ).DOMParser
  if (typeof domParser !== "function") {
    throw new Error(
      "parseNaListings needs a DOM parser; run it where DOMParser is available (for example Jest's jsdom environment)."
    )
  }

  const doc = new domParser().parseFromString(html, "text/html")
  const tabs = Array.from(doc.querySelectorAll('[role="tab"]'))
  const panels = Array.from(doc.querySelectorAll('[role="tabpanel"]'))

  const records: NaListing[] = []

  for (const panel of panels) {
    const sessionLabel = tabTextForPanel(panel, doc, tabs)

    for (const anchor of Array.from(panel.querySelectorAll("a[href]"))) {
      const url = resolveListingUrl(anchor.getAttribute("href") ?? "", pageUrl)
      if (!url) continue

      const filenameLabel = pdfFilename(url)
      if (!filenameLabel) continue

      records.push({
        house: "national-assembly",
        kind,
        sessionLabel,
        listedOn: parseListedOn(anchor.textContent),
        listingUrl: url.toString(),
        filenameLabel,
      })
    }
  }

  return records
}
