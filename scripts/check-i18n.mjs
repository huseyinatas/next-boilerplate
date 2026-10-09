import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const DICTIONARY_DIR = "src/i18n/dictionaries"
// Matches `type Dictionary = typeof tr` in src/i18n/dictionaries.ts.
const SOURCE_FILE = "tr.json"
const ACRONYMS = new Set(["HTML", "HTTP", "HTTPS", "JSON", "PDF", "SEO", "URL", "API", "FAQ"])

const copyChecks = [
  [/(?![©®™])\p{Extended_Pictographic}/u, "no emoji in copy"],
  [/[→←⇒➜»«]/u, "no arrows in copy; let the element's role carry the meaning"],
  [/ · /u, "no ' · ' meta separators in copy"],
  [/!/u, "no exclamation marks; state what happens in plain sentence case"],
  [/^\s|\s$/u, "no leading or trailing whitespace"],
]

function flatten(value, prefix = "") {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [[prefix, value]]
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  )
}

function loadDictionaries(dir) {
  const dictionaries = new Map()
  const problems = []
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {
    try {
      dictionaries.set(file, new Map(flatten(JSON.parse(readFileSync(join(dir, file), "utf8")))))
    } catch (error) {
      problems.push(`${DICTIONARY_DIR}/${file}: invalid JSON (${error.message})`)
    }
  }
  return { dictionaries, problems }
}

function checkKeys(path, entries, source) {
  const missing = [...source.keys()].filter((key) => !entries.has(key))
  const extra = [...entries.keys()].filter((key) => !source.has(key))
  return [
    ...missing.map((key) => `${path}: missing key "${key}" (defined in ${SOURCE_FILE})`),
    ...extra.map(
      (key) => `${path}: extra key "${key}"; add it to ${SOURCE_FILE} first or remove it`,
    ),
  ]
}

function checkCopy(path, key, value) {
  if (typeof value !== "string") return [`${path}: "${key}" must be a string`]
  const problems = copyChecks
    .filter(([pattern]) => pattern.test(value))
    .map(([, message]) => `${path}: "${key}": ${message}`)
  const shout = value.match(/\b\p{Lu}{4,}\b/gu)?.find((word) => !ACRONYMS.has(word))
  if (shout) problems.push(`${path}: "${key}": "${shout}" is all caps; write it in sentence case`)
  return problems
}

export function checkDictionaries(root = process.cwd()) {
  const { dictionaries, problems } = loadDictionaries(join(root, DICTIONARY_DIR))
  const source = dictionaries.get(SOURCE_FILE)
  if (!source)
    return [...problems, `${DICTIONARY_DIR}/${SOURCE_FILE}: source dictionary is missing`]

  for (const [file, entries] of dictionaries) {
    const path = `${DICTIONARY_DIR}/${file}`
    problems.push(...checkKeys(path, entries, source))
    for (const [key, value] of entries) problems.push(...checkCopy(path, key, value))
  }
  return problems
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const problems = checkDictionaries()
  for (const problem of problems.slice(0, 40)) console.log(problem)
  process.exitCode = problems.length > 0 ? 1 : 0
}
