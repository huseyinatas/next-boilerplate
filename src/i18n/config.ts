// Imported by the proxy and Client Components, so it must stay dependency-free.

// Set to false for a single-language site: only `defaultLocale` is served and the
// language switcher, locale detection and hreflang alternates are turned off.
// Widened to boolean so both branches stay type-checked.
export const I18N_ENABLED = true as boolean

export const defaultLocale = "tr"

const supportedLocales = [defaultLocale, "en"] as const

export type Locale = (typeof supportedLocales)[number]

export const locales: readonly Locale[] = I18N_ENABLED ? supportedLocales : [defaultLocale]

export const localeNames: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
}

// Remembers the visitor's explicit choice from the language switcher.
export const LOCALE_COOKIE = "NEXT_LOCALE"

export function hasLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value)
}

// The default locale is served without a prefix: "/about" rather than "/tr/about".
export function localizePath(locale: Locale, path = "/") {
  if (locale === defaultLocale) return path
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

// Each page sets its own: metadata merges shallowly, so a canonical set in the layout
// would mark every nested page as a duplicate of the home page.
export function localizedAlternates(locale: Locale, path = "/") {
  return {
    canonical: localizePath(locale, path),
    languages: I18N_ENABLED
      ? Object.fromEntries(locales.map((code) => [code, localizePath(code, path)]))
      : undefined,
  }
}

export function stripLocale(pathname: string) {
  const [, first, ...rest] = pathname.split("/")
  if (!hasLocale(first)) return pathname
  return `/${rest.join("/")}`
}
