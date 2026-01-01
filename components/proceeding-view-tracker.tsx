"use client"

import { useEffect } from "react"
import { trackProceedingView } from "@/lib/analytics"

export function ProceedingViewTracker({ proceedingId }: { proceedingId: string }) {
  useEffect(() => {
    trackProceedingView(proceedingId)
  }, [proceedingId])

  return null
}
