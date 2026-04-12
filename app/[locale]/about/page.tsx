import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { useTranslations } from 'next-intl'

export default function AboutPage() {
  const t = useTranslations('About')

  return (
    <div className="container mx-auto space-y-8 py-8">
      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden rounded-lg">
        <div className="absolute inset-0">
          <img
            src="parliament.jpg"
            alt="Pakistan Parliament"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center text-white">
          <h1 className="mb-4 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            {t('title')}
          </h1>
          <p className="text-xl text-white/80">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Journey Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('originalVision')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('originalVisionDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pivot')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('pivotDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('today')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('todayDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Article */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('mediaTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 md:flex-row">
          <img
            src="https://codeforpakistan.org/sites/default/files/cfp_logotype_h.png"
            alt="Code for Pakistan Logo"
            className="size-24 object-contain"
          />
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('mediaArticleTitle')}</h3>
            <p className="text-muted-foreground">
              {t('mediaArticleDesc')}
            </p>
            <Button variant="outline" asChild>
              <a
                href="https://codeforpakistan.org/stories/say-hello-to-my-new-friend"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                {t('readMore')}
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('featuresTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t('features.representativesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                {t('features.representativesDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t('features.locationTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                {t('features.locationDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t('features.chatTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                {t('features.chatDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t('features.availableTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                {t('features.availableDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t('features.searchTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                {t('features.searchDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t('features.languageTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                {t('features.languageDesc')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
