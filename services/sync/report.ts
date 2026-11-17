import { readFileSync } from "node:fs"

import {
  parseNaListings,
  type NaListing,
} from "../../packages/source/src/na-listings"
import { joinListings, type ListingJoin } from "./join"

export const ORDERS_PAGE_URL = "https://na.gov.pk/en/ordersoftheday.php"
export const BULLETIN_PAGE_URL = "https://na.gov.pk/en/bulletin.php"

export function ensureDomParser(): void {
  if (typeof globalThis.DOMParser === "function") return
  // Loaded only for the CLI. Jest already provides DOMParser, and importing
  // jsdom there fails because TextEncoder is not on that environment's global.
  const { JSDOM } = require("jsdom") as typeof import("jsdom")
  const { window } = new JSDOM("<!doctype html><html></html>")
  globalThis.DOMParser = window.DOMParser
}

export function reportFromHtml(
  ordersHtml: string,
  bulletinsHtml: string,
  ordersPageUrl = ORDERS_PAGE_URL,
  bulletinsPageUrl = BULLETIN_PAGE_URL
): ListingJoin {
  ensureDomParser()
  return joinListings(
    parseNaListings(ordersHtml, ordersPageUrl),
    parseNaListings(bulletinsHtml, bulletinsPageUrl)
  )
}

export function reportFromFiles(
  ordersPath: string,
  bulletinsPath: string
): ListingJoin {
  return reportFromHtml(
    readFileSync(ordersPath, "utf8"),
    readFileSync(bulletinsPath, "utf8")
  )
}

function rowLine(kind: "order" | "bulletin", row: NaListing): string {
  const session = row.sessionLabel ?? ""
  return `  ${kind}  ${session}  ${row.filenameLabel}  ${row.listingUrl}`
}

/** Plain-text dry run. It names listing URLs and does not include PDF bytes. */
export function formatReport(join: ListingJoin): string {
  const lines: string[] = [
    `orders ${
      join.groups.reduce((sum, group) => sum + group.orders.length, 0) +
      join.undatedOrders.length
    }`,
    `bulletins ${
      join.groups.reduce((sum, group) => sum + group.bulletins.length, 0) +
      join.undatedBulletins.length
    }`,
    `dates ${join.groups.length}`,
    `orders without a date ${join.undatedOrders.length}`,
    `bulletins without a date ${join.undatedBulletins.length}`,
    "",
  ]

  for (const group of join.groups) {
    lines.push(group.listedOn)
    for (const row of group.orders) lines.push(rowLine("order", row))
    for (const row of group.bulletins) lines.push(rowLine("bulletin", row))
    lines.push("")
  }

  if (join.undatedOrders.length > 0 || join.undatedBulletins.length > 0) {
    lines.push("undated")
    for (const row of join.undatedOrders) lines.push(rowLine("order", row))
    for (const row of join.undatedBulletins)
      lines.push(rowLine("bulletin", row))
    lines.push("")
  }

  return lines.join("\n")
}
