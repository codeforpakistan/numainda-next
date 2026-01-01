"use client"

import { useEffect } from "react"
import { trackConstitutionView } from "@/lib/analytics"

export function ConstitutionViewTracker() {
  useEffect(() => {
    trackConstitutionView()
  }, [])

  return null
}
