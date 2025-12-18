import Link from "next/link"
import { Github, Twitter } from "lucide-react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn("relative bottom-0 z-40 bg-[#F9FAFB] py-12", className)}
    >
      <div className="container px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground md:gap-6">
            <Link href="/about" className="transition-colors hover:text-primary">
              About
            </Link>
            <Link href="/chat" className="transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/api" className="transition-colors hover:text-primary">
              API
            </Link>
            <Link href="/contact" className="transition-colors hover:text-primary">
              Contact
            </Link>
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-2">
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary"
            >
              <Twitter className="size-4" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary"
            >
              <Github className="size-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Built with{" "}
          <span className="text-accent" aria-label="love">
            ❤️
          </span>{" "}
          by{" "}
          <Link
            href="https://codeforpakistan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary transition-colors hover:underline"
          >
            Code for Pakistan
          </Link>
        </div>
      </div>
    </footer>
  )
}
