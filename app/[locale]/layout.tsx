import { Metadata } from "next"
import { notFound } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"

import { routing, Locale } from "@/i18n/routing"
import { fontUrdu } from "@/lib/fonts"
import { cn } from "@/lib/utils"

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
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        lang={locale}
        dir={dir}
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isUrdu ? "font-urdu" : "font-sans",
          fontUrdu.variable,
          isUrdu && "leading-relaxed"
        )}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
