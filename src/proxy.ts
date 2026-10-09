import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"
import { NextResponse, type NextRequest } from "next/server"
import {
  defaultLocale,
  hasLocale,
  I18N_ENABLED,
  LOCALE_COOKIE,
  locales,
  localizePath,
  stripLocale,
  type Locale,
} from "@/i18n/config"

function getPreferredLocale(request: NextRequest): Locale {
  if (!I18N_ENABLED) return defaultLocale

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (hasLocale(cookie)) return cookie

  const headers = {
    "accept-language": request.headers.get("accept-language") ?? "",
  }
  const requested = new Negotiator({ headers }).languages().filter((tag) => tag !== "*")

  // The header is client-controlled and `match` throws on malformed tags.
  try {
    const matched = match(requested, locales, defaultLocale)
    return hasLocale(matched) ? matched : defaultLocale
  } catch {
    return defaultLocale
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const pathLocale = pathname.split("/")[1]

  if (pathLocale === defaultLocale) {
    request.nextUrl.pathname = stripLocale(pathname)
    return NextResponse.redirect(request.nextUrl)
  }

  if (hasLocale(pathLocale)) return NextResponse.next()

  const preferred = getPreferredLocale(request)
  if (preferred !== defaultLocale) {
    request.nextUrl.pathname = localizePath(preferred, pathname)
    return NextResponse.redirect(request.nextUrl)
  }

  request.nextUrl.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`
  return NextResponse.rewrite(request.nextUrl)
}

export const config = {
  // Skip Next internals, API routes and any path with a file extension (favicon, images).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
