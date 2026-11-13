import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

const withIntlConfig = withNextIntl(nextConfig)

// next-intl's plugin can set non-string values on `env` (for example
// `_next_intl_trailing_slash: undefined`). Next rejects those and can
// corrupt the worker env during static generation. Keep only strings.
if (withIntlConfig.env) {
  withIntlConfig.env = Object.fromEntries(
    Object.entries(withIntlConfig.env).filter(([, v]) => typeof v === 'string'),
  )
}

export default withIntlConfig
