'use client'
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { Menu, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MainNavProps {
  items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const router = useRouter()
  const { toast } = useToast()

  React.useEffect(() => {
    const accessToken = localStorage.getItem('access_token')
    setIsAuthenticated(!!accessToken)

    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token')
      setIsAuthenticated(!!token)
    }

    window.addEventListener('localStorageChange', handleStorageChange)
    return () => window.removeEventListener('localStorageChange', handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    window.dispatchEvent(new Event('localStorageChange'))
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    })
    router.refresh()
  }

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo-numainda.svg" alt="Numainda Logo" className="size-8" />
          <span className="inline-block font-bold">{siteConfig.name}</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Desktop Navigation */}
        {items?.length ? (
          <nav className="hidden gap-6 md:flex">
            {items?.map((item, index) => {
              if (item.children && item.children.length > 0) {
                return (
                  <div key={index} className="group relative">
                    <button
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground",
                        item.disabled && "cursor-not-allowed opacity-80"
                      )}
                    >
                      {item.title}
                      <ChevronDown className="size-4" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-50 min-w-[150px] rounded-md border bg-background p-2 opacity-0 shadow-md transition-all group-hover:visible group-hover:opacity-100">
                      {item.children.map((child, childIndex) => (
                        <Link
                          key={childIndex}
                          href={child.href || "#"}
                          className="block rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              }
              return (
                item.href && (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "flex items-center text-sm font-medium text-muted-foreground",
                      item.disabled && "cursor-not-allowed opacity-80"
                    )}
                  >
                    {item.title}
                  </Link>
                )
              )
            })}
          </nav>
        ) : null}

        {/* Logout Button */}
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hidden text-muted-foreground hover:text-foreground md:flex"
          >
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <nav className="absolute inset-x-0 top-16 border-b bg-background md:hidden">
          <div className="flex flex-col space-y-3 p-4">
            {items?.map((item, index) => {
              if (item.children && item.children.length > 0) {
                return (
                  <div key={index} className="space-y-2">
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    <div className="ml-4 flex flex-col space-y-2">
                      {item.children.map((child, childIndex) => (
                        <Link
                          key={childIndex}
                          href={child.href || "#"}
                          className="text-sm text-muted-foreground"
                          onClick={() => setIsOpen(false)}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              }
              return (
                item.href && (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "flex items-center text-sm font-medium text-muted-foreground",
                      item.disabled && "cursor-not-allowed opacity-80"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.title}
                  </Link>
                )
              )
            })}
            {/* Mobile Logout Button */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 size-4" />
                Logout
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
