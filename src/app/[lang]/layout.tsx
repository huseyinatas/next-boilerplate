import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { LanguageSwitcher } from "@/components/language-switcher"
import { env } from "@/env"
import { I18N_ENABLED, locales } from "@/i18n/config"
import { getDictionary, getLocale } from "@/i18n/dictionaries"
import { cn } from "@/lib/utils"
import "./globals.css"

// latin-ext covers Turkish characters such as ğ, ş and ı.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] })

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary()
  return {
    metadataBase: env.siteUrl,
    title: { default: dict.metadata.title, template: `%s | ${dict.metadata.title}` },
    description: dict.metadata.description,
  }
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale()
  const dict = await getDictionary()

  return (
    <html
      lang={locale}
      className={cn(geistSans.variable, geistMono.variable, "h-full antialiased")}
    >
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        {I18N_ENABLED ? (
          <header className="flex justify-end px-6 py-4">
            <LanguageSwitcher current={locale} label={dict.common.language} />
          </header>
        ) : null}
        {children}
      </body>
    </html>
  )
}
