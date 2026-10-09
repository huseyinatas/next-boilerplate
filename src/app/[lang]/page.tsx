import type { Metadata } from "next"
import { localizedAlternates } from "@/i18n/config"
import { getDictionary, getLocale } from "@/i18n/dictionaries"

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: localizedAlternates(await getLocale()) }
}

export default async function HomePage() {
  const dict = await getDictionary()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{dict.home.title}</h1>
      <p className="max-w-md text-lg leading-8 text-ink-muted">{dict.home.subtitle}</p>
    </main>
  )
}
