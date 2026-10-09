import { notFound } from "next/navigation"
import { lang } from "next/root-params"
import { hasLocale, type Locale } from "./config"
import type tr from "./dictionaries/tr.json"

// Turkish is the source of truth: every other dictionary must match its shape.
export type Dictionary = typeof tr

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  tr: () => import("./dictionaries/tr.json").then((module) => module.default),
  en: () => import("./dictionaries/en.json").then((module) => module.default),
}

export async function getLocale(): Promise<Locale> {
  const locale = await lang()
  if (!hasLocale(locale)) notFound()
  return locale
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]()
}
