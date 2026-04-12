import "@/styles/globals.css"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"

import { routing, Locale } from "@/i18n/routing"
import { fontSans, fontUrdu } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"
import { GoogleAnalytics } from "@/components/google-analytics"
import { FloatingChatBubble } from "@/components/floating-chat-bubble"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" })

  return {
    title: {
      default: t("title"),
      template: `%s - ${t("title")}`,
    },
    description: t("description"),
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "white" },
      { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Opt out of static generation for locale routes. next-intl 3.x requires
// `unstable_setRequestLocale` in every statically-rendered file, and without
// it the SSG worker crashes (chunks/5525 dump). Dynamic rendering is fine
// here because every page under this layout already fetches data
// per-request.
export const dynamic = 'force-dynamic'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()
  const isUrdu = locale === "ur"
  const dir = isUrdu ? "rtl" : "ltr"

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          isUrdu ? "font-urdu" : "font-sans",
          fontSans.variable,
          fontUrdu.variable,
          isUrdu && "leading-relaxed"
        )}
      >
        <style>{`
          [lang="ur"] { line-height: 2; }
          [lang="ur"] h1, [lang="ur"] h2, [lang="ur"] h3 { line-height: 1.6; }
        `}</style>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="relative flex h-screen flex-col">
              <SiteHeader />
              <div className="flex min-h-0 flex-1 overflow-y-auto">{children}</div>
              <Footer />
              <Toaster />
              <FloatingChatBubble />
            </div>
            <TailwindIndicator />
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
