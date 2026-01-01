"use client"

import { useEffect } from "react"
import { trackBillView } from "@/lib/analytics"

export function BillViewTracker({ billId }: { billId: string }) {
  useEffect(() => {
    trackBillView(billId)
  }, [billId])

  return null
}
