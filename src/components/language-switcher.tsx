"use client"

import { Languages } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LOCALE_COOKIE,
  localeNames,
  locales,
  localizePath,
  stripLocale,
  type Locale,
} from "@/i18n/config"
import { cn } from "@/lib/utils"

type LanguageSwitcherProps = {
  current: Locale
  label: string
}

// Lets the proxy send returning visitors straight to their chosen language.
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}

export function LanguageSwitcher({ current, label }: LanguageSwitcherProps) {
  const pathname = stripLocale(usePathname())

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-sm">
      <Languages aria-hidden className="mr-1 size-4 text-ink-muted" />
      {locales.map((locale) => (
        <Link
          key={locale}
          href={localizePath(locale, pathname)}
          // A prefetch would capture the proxy redirect made with the old cookie.
          prefetch={false}
          hrefLang={locale}
          lang={locale}
          onClick={() => {
            rememberLocale(locale)
          }}
          aria-current={locale === current ? "true" : undefined}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            locale === current
              ? "bg-accent text-accent-ink"
              : "text-ink-muted hover:bg-surface-muted hover:text-ink",
          )}
        >
          {localeNames[locale]}
        </Link>
      ))}
    </nav>
  )
}
