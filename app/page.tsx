import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, BookOpen, Calendar, MapPin } from 'lucide-react'
import { HomeChatInput } from "@/components/home-chat-input"

export default function IndexPage() {
  return (
    <div className="relative flex w-full flex-col">
      {/* Hero Section - Chat First */}
      <div className="flex flex-col items-center justify-center px-4 py-12 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              What would you like to know?
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Your AI guide to Pakistan&apos;s constitution, laws, and parliament
            </p>
          </div>

          {/* Chat Input */}
          <HomeChatInput />
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="border-t bg-muted/30">
        <div className="container max-w-6xl px-4 py-8 md:py-12">
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-6">
            <Link href="/representatives">
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full">
                <CardHeader className="pb-3">
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

            <Link href="/representatives">
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <MapPin className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Find My MNA</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Search by location or name
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/bills">
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full">
                <CardHeader className="pb-3">
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
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full">
                <CardHeader className="pb-3">
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
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full">
                <CardHeader className="pb-3">
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
          <div className="mt-8 w-full rounded-xl border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 md:mt-10 md:p-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">332</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">Representatives</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">280+</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">26</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">Amendments</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
