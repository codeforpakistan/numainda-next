import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
}

const withIntlConfig = withNextIntl(nextConfig)

// Next 13's config validator requires every value in `env` to be a string.
// next-intl/plugin sets `_next_intl_trailing_slash: undefined` when
// trailingSlash is falsy, which trips the validator and corrupts the
// worker-process env during static generation. Strip undefined values.
if (withIntlConfig.env) {
  withIntlConfig.env = Object.fromEntries(
    Object.entries(withIntlConfig.env).filter(([, v]) => typeof v === 'string'),
  )
}

export default withIntlConfig
