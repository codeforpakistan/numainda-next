import { Metadata } from "next"
import { notFound } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"

import { routing, Locale } from "@/i18n/routing"
import { fontUrdu } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Metadata" })

  return {
    title: {
      default: t("title"),
      template: `%s - ${t("title")}`,
    },
    description: t("description"),
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

// Pages under this layout read request data. Keep the segment dynamic so
// locale negotiation does not depend on static rendering setup.
export const dynamic = 'force-dynamic'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
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
