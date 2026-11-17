import { readFileSync } from "node:fs"
import path from "node:path"

import type { NaListing } from "../../packages/source/src/na-listings"
import { joinListings } from "./join"
import { formatReport, reportFromHtml } from "./report"

function row(
  kind: NaListing["kind"],
  listedOn: string | null,
  filename: string
): NaListing {
  return {
    house: "national-assembly",
    kind,
    sessionLabel: "30th Session",
    listedOn,
    listingUrl: `https://na.gov.pk/uploads/documents/${filename}`,
    filenameLabel: filename,
  }
}

describe("joinListings", () => {
  const orders = [
    row("order", "2026-10-30", "order-30.pdf"),
    row("order", "2026-10-28", "order-28.pdf"),
    row("order", null, "order-undated.pdf"),
  ]
  const bulletins = [
    row("bulletin", "2026-10-30", "bulletin-30.pdf"),
    row("bulletin", "2026-10-29", "bulletin-29.pdf"),
    row("bulletin", null, "bulletin-undated.pdf"),
  ]

  const join = joinListings(orders, bulletins)

  it("groups a shared date and keeps order-only and bulletin-only dates", () => {
    expect(join.groups.map((group) => group.listedOn)).toEqual([
      "2026-10-30",
      "2026-10-29",
      "2026-10-28",
    ])
    expect(join.groups[0].orders.map((item) => item.filenameLabel)).toEqual([
      "order-30.pdf",
    ])
    expect(join.groups[0].bulletins.map((item) => item.filenameLabel)).toEqual([
      "bulletin-30.pdf",
    ])
    expect(join.groups[1].orders).toEqual([])
    expect(join.groups[2].bulletins).toEqual([])
  })

  it("does not invent a date for a link that has no year", () => {
    expect(join.undatedOrders.map((item) => item.filenameLabel)).toEqual([
      "order-undated.pdf",
    ])
    expect(join.undatedBulletins.map((item) => item.filenameLabel)).toEqual([
      "bulletin-undated.pdf",
    ])
  })
})

describe("reportFromHtml", () => {
  const fixture = (name: string) =>
    readFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "packages",
        "source",
        "src",
        "__fixtures__",
        name
      ),
      "utf8"
    )

  it("joins the accordion fixture with a bulletin page and drops the footer PDF", () => {
    const bulletinHtml = `<!doctype html><html><body>
      <div id="accordion">
        <h3><a href="#526">30th Session From 13th Oct To 30th Oct 2026</a></h3>
        <div>
          <a href="../uploads/documents/6afac2fe79133_196.pdf">Friday, the 30th October, 2026</a>
        </div>
      </div>
      <footer><a href="https://na.gov.pk/uploads/OrganogramNA.pdf">Organizational Chart</a></footer>
    </body></html>`

    const report = formatReport(
      reportFromHtml(fixture("orders-accordion.html"), bulletinHtml)
    )

    expect(report).toContain("orders 3")
    expect(report).toContain("bulletins 1")
    expect(report).toContain("orders without a date 1")
    expect(report).toContain("2026-10-30")
    expect(report).toContain("6afac2fe79133_196.pdf")
    expect(report).toContain("Orders of the Day, 30-10-2026.pdf")
    expect(report).not.toContain("Ruling-Web.pdf")
    expect(report).not.toContain("OrganogramNA.pdf")
    expect(report).toContain("undated")
    expect(report).toContain("Orders of the Day (23-10-2026).pdf")
  })
})
