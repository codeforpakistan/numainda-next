'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('Navigation')

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'ur' : 'en'
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="text-sm font-medium"
    >
      {t('switchLanguage')}
    </Button>
  )
}
