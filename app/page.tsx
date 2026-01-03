import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, BookOpen, Calendar } from 'lucide-react'
import { RepresentativeSearch } from "@/components/representative-search"

export default function IndexPage() {
  return (
    <div className="relative flex w-full flex-col">
      {/* Simple Hero Section */}
      <div className="border-b bg-muted/30 py-8 md:py-12">
        <div className="container max-w-6xl px-4">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                Find your representative
              </h1>
            </div>

            {/* Search Box */}
            <div className="rounded-lg border bg-card p-4 shadow-md md:p-6">
              <RepresentativeSearch />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl flex flex-col gap-8 px-4 py-8 md:gap-10 md:py-12">

      {/* Quick Access Navigation */}
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/representatives">
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="size-5 text-primary" />
                </div>
                <CardTitle className="text-base">Representatives</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Browse all 332 MNAs
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bills">
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="size-5 text-primary" />
                </div>
                <CardTitle className="text-base">Bills & Acts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Legislative documents
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/constitution">
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <CardTitle className="text-base">Constitution</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Read the constitution
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/proceedings">
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="size-5 text-primary" />
                </div>
                <CardTitle className="text-base">Proceedings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Parliamentary sessions
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="w-full rounded-xl border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 md:p-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary md:text-5xl">332</div>
            <div className="mt-2 text-base font-medium text-muted-foreground">Representatives</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary md:text-5xl">280+</div>
            <div className="mt-2 text-base font-medium text-muted-foreground">Articles</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary md:text-5xl">26</div>
            <div className="mt-2 text-base font-medium text-muted-foreground">Amendments</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

