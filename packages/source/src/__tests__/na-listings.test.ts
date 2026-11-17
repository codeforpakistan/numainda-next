import { readFileSync } from "node:fs"
import path from "node:path"

import { parseNaListings } from "../na-listings"

const ORDERS_URL = "https://na.gov.pk/en/ordersoftheday.php"
const BULLETIN_URL = "https://na.gov.pk/en/bulletin.php"

function fixture(name: string): string {
  return readFileSync(path.join(__dirname, "..", "__fixtures__", name), "utf8")
}

const ordersHtml = fixture("orders.html")
const bulletinHtml = fixture("bulletin.html")

describe("parseNaListings on an Orders of the Day page", () => {
  const records = parseNaListings(ordersHtml, ORDERS_URL)

  it("returns one record per PDF inside a tabpanel", () => {
    expect(records).toHaveLength(6)
  })

  it("tags records with the National Assembly house and order kind", () => {
    expect(new Set(records.map((record) => record.house))).toEqual(
      new Set(["national-assembly"])
    )
    expect(new Set(records.map((record) => record.kind))).toEqual(
      new Set(["order"])
    )
  })

  it("skips non-PDF anchors and PDFs outside a tabpanel", () => {
    const filenames = records.map((record) => record.filenameLabel)
    expect(filenames).not.toContain("minutes-of-the-sitting.docx")
    expect(filenames).not.toContain("OrganogramNA.pdf")
    expect(filenames).not.toContain("Ruling-Web.pdf")
  })

  it("labels rows with the text of their session tab", () => {
    expect(records.map((record) => record.sessionLabel)).toEqual([
      "30th Session From 13th Oct To 30th Oct 2026",
      "30th Session From 13th Oct To 30th Oct 2026",
      "30th Session From 13th Oct To 30th Oct 2026",
      "29th Session",
      "29th Session",
      null,
    ])
  })

  it("reads the sitting date from link text and keeps rows without a date", () => {
    expect(records.map((record) => record.listedOn)).toEqual([
      "2026-10-30",
      "2026-10-28",
      null,
      "2026-08-28",
      "2026-08-25",
      "2026-10-15",
    ])
  })

  it("keeps the PDF filename, decoded, as the label", () => {
    expect(records.map((record) => record.filenameLabel)).toEqual([
      "Orders of the Day, 30-10-2026.pdf",
      "ilovepdf_merged (1).pdf",
      "Orders of the Day (23-10-2026).pdf",
      "Orders of the Day (28-08-2026).pdf",
      "ORDER-OF-THE-DAY-25-08-2026.PDF",
      "Orders of the Day (Joint Sitting) 15-10-26.pdf",
    ])
  })

  it("resolves ../ and root-relative links to absolute na.gov.pk URLs", () => {
    for (const record of records) {
      expect(
        record.listingUrl.startsWith("https://na.gov.pk/uploads/documents/")
      ).toBe(true)
      expect(record.listingUrl).not.toContain("..")
    }
    expect(decodeURIComponent(records[0].listingUrl)).toBe(
      "https://na.gov.pk/uploads/documents/Orders of the Day, 30-10-2026.pdf"
    )
  })
})

describe("parseNaListings on a Daily Bulletin page", () => {
  const records = parseNaListings(bulletinHtml, BULLETIN_URL)

  it("tags records as bulletins and resolves root-relative links", () => {
    expect(records).toHaveLength(2)
    expect(new Set(records.map((record) => record.kind))).toEqual(
      new Set(["bulletin"])
    )
    expect(records[0]).toMatchObject({
      house: "national-assembly",
      kind: "bulletin",
      sessionLabel: "October 2026",
      listedOn: "2026-10-30",
      listingUrl: "https://na.gov.pk/uploads/documents/6afac2fe79133_196.pdf",
      filenameLabel: "6afac2fe79133_196.pdf",
    })
  })

  it("accepts day-first numeric dates in link text", () => {
    expect(records[1]).toMatchObject({
      listedOn: "2026-10-30",
      listingUrl: "https://na.gov.pk/uploads/documents/6afac2f53e0f0_999.pdf",
      filenameLabel: "6afac2f53e0f0_999.pdf",
    })
  })

  it("ignores footer PDFs outside the tabpanel", () => {
    expect(records.map((record) => record.filenameLabel)).not.toContain(
      "OrganogramNA.pdf"
    )
  })
})

describe("parseNaListings edge cases", () => {
  it("returns no records when the page has no tabpanels", () => {
    const html = `<html><body><a href="/uploads/documents/order.pdf">Friday, the 30th October, 2026</a></body></html>`
    expect(parseNaListings(html, ORDERS_URL)).toEqual([])
  })

  it("rejects pages it does not know how to label", () => {
    expect(() =>
      parseNaListings(ordersHtml, "https://na.gov.pk/en/index.php")
    ).toThrow(/ordersoftheday\.php/)
  })
})
