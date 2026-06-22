'use client'

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()
  
  // Hide footer only on chat pages
  const isChatPage = pathname.includes('/chat')
  
  return (
    <>
      <SiteHeader />
      <div className="flex min-h-0 flex-1 overflow-y-auto">{children}</div>
      {!isChatPage && <Footer />}
    </>
  )
}
