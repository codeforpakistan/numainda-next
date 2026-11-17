import type { NaListing } from "../../packages/source/src/na-listings"

export interface DatedGroup {
  listedOn: string
  orders: NaListing[]
  bulletins: NaListing[]
}

export interface ListingJoin {
  groups: DatedGroup[]
  undatedOrders: NaListing[]
  undatedBulletins: NaListing[]
}

/**
 * Groups orders and bulletins that print the same sitting date.
 * A row whose link text has no year stays in the undated list.
 * Several documents on one date stay several rows.
 */
export function joinListings(
  orders: NaListing[],
  bulletins: NaListing[]
): ListingJoin {
  const undatedOrders = orders.filter((row) => row.listedOn == null)
  const undatedBulletins = bulletins.filter((row) => row.listedOn == null)
  const dates = new Set<string>()

  for (const row of [...orders, ...bulletins]) {
    if (row.listedOn) dates.add(row.listedOn)
  }

  const groups = [...dates]
    .sort()
    .reverse()
    .map((listedOn) => ({
      listedOn,
      orders: orders.filter((row) => row.listedOn === listedOn),
      bulletins: bulletins.filter((row) => row.listedOn === listedOn),
    }))

  return { groups, undatedOrders, undatedBulletins }
}
