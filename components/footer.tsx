import Link from "next/link"

import { cn } from "@/lib/utils"

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn("border-t relative bottom-0 z-40 bg-background", className)}
    >
      <div className="container flex h-14 items-center justify-center text-sm">
        Built with{" "}
        <span className="mx-1 text-red-500" aria-label="love">
          ❤️
        </span>{" "}
        by{" "}
        <Link
          href="https://codeforpakistan.org"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-medium underline underline-offset-4 hover:text-primary"
        >
          Code For Pakistan
        </Link>
      </div>
    </footer>
  )
}
