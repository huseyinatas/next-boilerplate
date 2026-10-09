import Link from "next/link"
import { localizePath } from "@/i18n/config"
import { getDictionary, getLocale } from "@/i18n/dictionaries"

export default async function NotFound() {
  const locale = await getLocale()
  const dict = await getDictionary()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{dict.notFound.title}</h1>
      <p className="text-ink-muted">{dict.notFound.description}</p>
      <Link
        href={localizePath(locale)}
        className="underline underline-offset-4 hover:text-ink-muted"
      >
        {dict.notFound.home}
      </Link>
    </main>
  )
}
