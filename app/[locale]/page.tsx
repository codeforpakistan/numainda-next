import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, BookOpen, Calendar, MapPin } from 'lucide-react'
import { HomeChatInput } from "@/components/home-chat-input"

export default function IndexPage() {
  const t = useTranslations('Home')

  return (
    <div className="relative flex w-full flex-col">
      {/* Hero Section - Chat First */}
      <div className="flex flex-col items-center justify-center px-4 py-12 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {t('title')}
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              {t('subtitle')}
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
                    <CardTitle className="text-base">{t('cards.representatives')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('cards.representativesDesc')}
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
                    <CardTitle className="text-base">{t('cards.findMNA')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('cards.findMNADesc')}
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
                    <CardTitle className="text-base">{t('cards.bills')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('cards.billsDesc')}
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
                    <CardTitle className="text-base">{t('cards.constitution')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('cards.constitutionDesc')}
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
                    <CardTitle className="text-base">{t('cards.proceedings')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('cards.proceedingsDesc')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 w-full rounded-xl border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 md:mt-10 md:p-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{t('stats.representativesCount')}</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{t('stats.representatives')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{t('stats.articlesCount')}</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{t('stats.articles')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{t('stats.amendmentsCount')}</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{t('stats.amendments')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
