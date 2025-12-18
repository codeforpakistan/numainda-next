'use client'
import Link from "next/link"
import { useEffect, useState } from "react"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full bg-white transition-shadow duration-200",
      scrolled && "shadow-md"
    )}>
      <div className="container flex h-20 items-center justify-between">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="ghostIndigo" size="icon">
                <Icons.gitHub className="size-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="ghostIndigo" size="icon">
                <Icons.twitter className="size-5 fill-current" />
                <span className="sr-only">Twitter</span>
              </Button>
            </Link>
          </nav>
          <Button asChild className="hidden md:inline-flex">
            <Link href="/chat">Start Searching</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

