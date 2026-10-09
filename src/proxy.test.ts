import {
  getRedirectUrl,
  getRewrittenUrl,
  isRewrite,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server"
import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { defaultLocale, LOCALE_COOKIE, locales } from "@/i18n/config"
import { config, proxy } from "./proxy"

const origin = "https://example.com"
const otherLocale = locales.find((locale) => locale !== defaultLocale) ?? defaultLocale

function requestTo(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, origin), { headers })
}

describe("proxy matcher", () => {
  it("runs for pages and skips internals and files", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "/about" })).toBe(true)
    expect(unstable_doesMiddlewareMatch({ config, url: "/_next/static/chunk.js" })).toBe(false)
    expect(unstable_doesMiddlewareMatch({ config, url: "/favicon.ico" })).toBe(false)
    expect(unstable_doesMiddlewareMatch({ config, url: "/api/health" })).toBe(false)
  })
})

describe("proxy", () => {
  it("redirects a default-locale prefix to the unprefixed URL", () => {
    const response = proxy(requestTo(`/${defaultLocale}/about`))
    expect(getRedirectUrl(response)).toBe(`${origin}/about`)
  })

  it("rewrites unprefixed paths to the default locale", () => {
    const response = proxy(requestTo("/about"))
    expect(isRewrite(response)).toBe(true)
    expect(getRewrittenUrl(response)).toBe(`${origin}/${defaultLocale}/about`)
  })

  it("survives a malformed Accept-Language header", () => {
    const response = proxy(requestTo("/", { "accept-language": "*;q=x, ???" }))
    expect(getRewrittenUrl(response)).toBe(`${origin}/${defaultLocale}`)
  })

  it.runIf(otherLocale !== defaultLocale)("lets prefixed locales through", () => {
    const response = proxy(requestTo(`/${otherLocale}/about`))
    expect(isRewrite(response)).toBe(false)
    expect(getRedirectUrl(response)).toBeNull()
  })

  it.runIf(otherLocale !== defaultLocale)("follows the browser language", () => {
    const response = proxy(requestTo("/about", { "accept-language": `${otherLocale};q=0.9` }))
    expect(getRedirectUrl(response)).toBe(`${origin}/${otherLocale}/about`)
  })

  it.runIf(otherLocale !== defaultLocale)("prefers the saved choice over the browser", () => {
    const response = proxy(
      requestTo("/about", {
        "accept-language": otherLocale,
        cookie: `${LOCALE_COOKIE}=${defaultLocale}`,
      }),
    )
    expect(getRewrittenUrl(response)).toBe(`${origin}/${defaultLocale}/about`)
  })
})
