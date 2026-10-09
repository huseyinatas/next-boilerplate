import { describe, expect, it } from "vitest"
import {
  defaultLocale,
  hasLocale,
  locales,
  localizedAlternates,
  localizePath,
  stripLocale,
} from "./config"

const otherLocale = locales.find((locale) => locale !== defaultLocale) ?? defaultLocale

describe("localizePath", () => {
  it("serves the default locale without a prefix", () => {
    expect(localizePath(defaultLocale)).toBe("/")
    expect(localizePath(defaultLocale, "/about")).toBe("/about")
  })

  it.runIf(otherLocale !== defaultLocale)("prefixes every other locale", () => {
    expect(localizePath(otherLocale)).toBe(`/${otherLocale}`)
    expect(localizePath(otherLocale, "/about")).toBe(`/${otherLocale}/about`)
  })
})

describe("stripLocale", () => {
  it("keeps paths that start with something other than a locale", () => {
    expect(stripLocale("/about")).toBe("/about")
    expect(stripLocale(`/${otherLocale}x/about`)).toBe(`/${otherLocale}x/about`)
  })

  it.runIf(otherLocale !== defaultLocale)("removes a locale prefix", () => {
    expect(stripLocale(`/${otherLocale}`)).toBe("/")
    expect(stripLocale(`/${otherLocale}/about`)).toBe("/about")
  })
})

describe("hasLocale", () => {
  it("accepts configured locales only", () => {
    expect(hasLocale(defaultLocale)).toBe(true)
    expect(hasLocale("xx")).toBe(false)
    expect(hasLocale(undefined)).toBe(false)
  })
})

describe("localizedAlternates", () => {
  it("points the canonical URL at the page itself, not the home page", () => {
    expect(localizedAlternates(defaultLocale, "/about").canonical).toBe("/about")
  })

  it.runIf(otherLocale !== defaultLocale)("lists every locale for the same page", () => {
    expect(localizedAlternates(otherLocale, "/about").languages).toEqual(
      Object.fromEntries(locales.map((code) => [code, localizePath(code, "/about")])),
    )
  })
})
