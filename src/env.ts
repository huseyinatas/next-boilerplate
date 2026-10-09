// The only module that reads process.env: parse values here so a bad deploy fails on startup.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const env = {
  // Origin for canonical and hreflang URLs. When unset, Next.js falls back to the
  // Vercel deployment URL or localhost, so set it for every production deploy.
  siteUrl: siteUrl ? new URL(siteUrl) : undefined,
}
