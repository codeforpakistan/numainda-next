import { readFileSync } from "node:fs"
import path from "node:path"

import { parseListedOn, parseNaListings } from "../na-listings"

const ORDERS_URL = "https://na.gov.pk/en/ordersoftheday.php"
const BULLETIN_URL = "https://na.gov.pk/en/bulletin.php"

function fixture(name: string): string {
  return readFileSync(path.join(__dirname, "..", "__fixtures__", name), "utf8")
}

const ordersHtml = fixture("orders.html")
const bulletinHtml = fixture("bulletin.html")
const accordionHtml = fixture("orders-accordion.html")

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

describe("parseNaListings on the server-rendered accordion", () => {
  const records = parseNaListings(accordionHtml, ORDERS_URL)

  it("reads one record per PDF under each h3 session header", () => {
    expect(records).toHaveLength(3)
    expect(records.map((record) => record.sessionLabel)).toEqual([
      "30th Session From 13th Oct To 30th Oct 2026",
      "30th Session From 13th Oct To 30th Oct 2026",
      "29th Session",
    ])
  })

  it("applies the same URL, date, and filename rules as the tab path", () => {
    expect(records.map((record) => record.listedOn)).toEqual([
      "2026-10-30",
      null,
      "2026-08-25",
    ])
    expect(records.map((record) => record.filenameLabel)).toEqual([
      "Orders of the Day, 30-10-2026.pdf",
      "Orders of the Day (23-10-2026).pdf",
      "ORDER-OF-THE-DAY-25-08-2026.PDF",
    ])
    for (const record of records) {
      expect(record.kind).toBe("order")
      expect(
        record.listingUrl.startsWith("https://na.gov.pk/uploads/documents/")
      ).toBe(true)
      expect(record.listingUrl).not.toContain("..")
    }
  })

  it("skips the session header link and PDFs outside #accordion", () => {
    const filenames = records.map((record) => record.filenameLabel)
    expect(filenames).not.toContain("Ruling-Web.pdf")
    expect(filenames).not.toContain("OrganogramNA.pdf")
    expect(
      records.every(
        (record) => record.listingUrl !== "https://na.gov.pk/en/#526"
      )
    ).toBe(true)
  })
})

describe("parseListedOn", () => {
  it("accepts the punctuation the Assembly actually publishes", () => {
    const cases: Array<[string, string]> = [
      ["Friday, the 23rd January, 2026", "2026-01-23"],
      ["Monday, the 12th January , 2026", "2026-01-12"],
      ["Monday,the 8th December,2025", "2025-12-08"],
      ["Monday,the 28th October2024", "2024-10-28"],
      ["Monday, the 10th Febuary,2025", "2025-02-10"],
      ["Friday, the 21th March , 2025", "2025-03-21"],
      ["30-10-2026", "2026-10-30"],
    ]

    for (const [text, expected] of cases) {
      expect([text, parseListedOn(text)]).toEqual([text, expected])
    }
  })

  it("returns null instead of guessing a missing or impossible date", () => {
    for (const text of [
      "Monday, the 16th December",
      "Order of the Day",
      "Untitled 22",
      "31-02-2026",
      "",
    ]) {
      expect([text, parseListedOn(text)]).toEqual([text, null])
    }
  })
})

describe("parseNaListings edge cases", () => {
  it("returns no records when the page has neither tabpanels nor an accordion", () => {
    const html = `<html><body><a href="/uploads/documents/order.pdf">Friday, the 30th October, 2026</a></body></html>`
    expect(parseNaListings(html, ORDERS_URL)).toEqual([])
  })

  it("rejects pages it does not know how to label", () => {
    expect(() =>
      parseNaListings(ordersHtml, "https://na.gov.pk/en/index.php")
    ).toThrow(/ordersoftheday\.php/)
  })
})
