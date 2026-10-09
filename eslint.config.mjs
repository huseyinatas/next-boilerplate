import js from "@eslint/js"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import checkFile from "eslint-plugin-check-file"
import jsxA11y from "eslint-plugin-jsx-a11y"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"
import commentHygiene from "./scripts/eslint/comment-hygiene.mjs"

// Error messages are the rules agents actually read, so each one names the replacement.

const DICTIONARY_TEXT =
  "User-facing text lives in src/i18n/dictionaries: add the key to tr.json, then to every other dictionary, and read it with getDictionary() (Server Components) or receive it as a prop (Client Components)."

const NEXT_SPECIAL_FILES =
  "src/app/**/{page,layout,template,loading,error,global-error,not-found,forbidden,unauthorized,default,opengraph-image,twitter-image,icon,apple-icon,sitemap,robots,manifest}.{ts,tsx}"

const VAGUE_NAMES =
  "^(?:data|item|items|info|temp|tmp|result|res|obj|val|helper|manager|processData|handleData)$"

const restrictedImports = {
  paths: [
    { name: "framer-motion", message: "Import from 'motion/react'." },
    { name: "classnames", message: "Compose classes with cn() from '@/lib/utils'." },
    { name: "clsx", message: "Compose classes with cn() from '@/lib/utils'." },
    { name: "tailwind-merge", message: "Compose classes with cn() from '@/lib/utils'." },
    { name: "next/router", message: "App Router: use 'next/navigation'." },
    { name: "next/head", message: "App Router: export metadata or generateMetadata instead." },
    { name: "next/legacy/image", message: "Use 'next/image'." },
    {
      name: "react",
      importNames: ["useMemo", "useCallback", "memo"],
      message:
        "React Compiler memoizes automatically (reactCompiler: true in next.config.ts). If you need a stable identity, stop and ask.",
    },
    {
      name: "react",
      importNames: ["forwardRef"],
      message: "React 19 passes ref as a regular prop.",
    },
    {
      name: "react-dom",
      importNames: ["useFormState"],
      message: "Use useActionState from 'react'.",
    },
  ],
  patterns: [
    {
      group: ["react-icons", "react-icons/*", "@heroicons/*"],
      message: "Use icons from 'lucide-react'.",
    },
    {
      group: ["../*"],
      message: "Import across folders with '@/…'; relative imports only within one folder.",
    },
  ],
}

const restrictedSyntax = [
  {
    selector: "NewExpression[callee.name='IntersectionObserver']",
    message: "Use whileInView or useInView from 'motion/react'.",
  },
  {
    selector: "CallExpression[callee.name='requestAnimationFrame']",
    message: "Use a CSS transition or Motion (animate, useAnimationFrame) instead of a frame loop.",
  },
  {
    selector: "CallExpression[callee.property.name='addEventListener'][arguments.0.value='scroll']",
    message: "Use useScroll from 'motion/react' instead of a scroll listener.",
  },
  {
    selector: "CallExpression[callee.name='useEffect'] CallExpression[callee.name='fetch']",
    message: "Fetch in a Server Component and pass the data down as props.",
  },
  {
    selector:
      "CallExpression[callee.name=/^(?:useMount|useUnmount|useEffectOnce|useUpdateEffect|useDidMount|useIsMounted)$/]",
    message:
      "No lifecycle-wrapper hooks; derive values during render or handle the event directly.",
  },
  {
    selector: "TSTypeReference[typeName.name=/^(?:FC|FunctionComponent)$/]",
    message: "Type props on the function itself: function RoomCard({ room }: RoomCardProps).",
  },
  {
    selector: "TSTypeReference[typeName.right.name=/^(?:FC|FunctionComponent)$/]",
    message: "Type props on the function itself: function RoomCard({ room }: RoomCardProps).",
  },
  {
    selector: "JSXAttribute[name.name='className'] > JSXExpressionContainer > TemplateLiteral",
    message: "Compose classes with cn() from '@/lib/utils' instead of a template literal.",
  },
  {
    selector:
      "JSXOpeningElement[name.name='Image'] > JSXAttribute[name.name=/^(?:priority|onLoadingComplete)$/]",
    message:
      "Deprecated next/image prop: use preload (or loading='eager' / fetchPriority='high') and onLoad. See node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md.",
  },
  {
    selector:
      "JSXAttribute[name.name=/^(?:aria-label|aria-description|alt|title|placeholder)$/] > Literal[value=/\\S/]",
    message: DICTIONARY_TEXT,
  },
  {
    selector:
      ":matches(JSXElement, JSXFragment) > JSXExpressionContainer > :matches(ConditionalExpression, LogicalExpression) > Literal[value=/\\p{L}/u]",
    message: DICTIONARY_TEXT,
  },
  {
    selector: "Literal[value=/(?![\\u00A9\\u00AE\\u2122])\\p{Extended_Pictographic}/u]",
    message: "No emoji in strings.",
  },
  {
    selector: "TemplateElement[value.raw=/(?![\\u00A9\\u00AE\\u2122])\\p{Extended_Pictographic}/u]",
    message: "No emoji in strings.",
  },
  {
    selector: `VariableDeclarator > Identifier.id[name=/${VAGUE_NAMES}/]`,
    message: "Name values by their domain role (rooms, nightlyRate), not their shape.",
  },
  {
    selector: `ObjectPattern > Property[shorthand=true] > Identifier.value[name=/${VAGUE_NAMES}/]`,
    message: "Rename when destructuring: const { data: rooms } = …",
  },
  {
    selector: `:function > Identifier.params[name=/${VAGUE_NAMES}/]`,
    message: "Name parameters by their domain role (room, booking), not their shape.",
  },
  {
    selector: `FunctionDeclaration > Identifier.id[name=/${VAGUE_NAMES}/]`,
    message: "Name functions by what they do in the domain (listRooms, formatNightlyRate).",
  },
  {
    selector:
      ":matches(VariableDeclarator, FunctionDeclaration, ClassDeclaration, TSTypeAliasDeclaration, TSInterfaceDeclaration) > Identifier.id[name=/(?:Enhanced|Improved|Optimized|Robust|Comprehensive|Ultimate)|(?:V\\d+|Old|Legacy)$/]",
    message:
      "No hype or version words in names; say what it is (BookingButton, not EnhancedButton).",
  },
]

const sourceOnlySyntax = [
  {
    selector: "MemberExpression[object.name='process'][property.name='env']",
    message:
      "Read environment variables only in src/env.ts (validated once on load) and import them from '@/env'.",
  },
]

export default defineConfig([
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      "@typescript-eslint/no-unsafe-type-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "all", argsIgnorePattern: "^_", caughtErrors: "all", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
    plugins: { "check-file": checkFile, local: { rules: { "comment-hygiene": commentHygiene } } },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      complexity: ["error", 10],
      eqeqeq: ["error", "always"],
      "func-style": ["error", "declaration"],
      "max-depth": ["error", 4],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 3],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-nested-ternary": "error",
      "no-restricted-imports": ["error", restrictedImports],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "requestAnimationFrame",
          message: "Use a CSS transition or Motion.",
        },
        { property: "animate", message: "Use animate() from 'motion/react' or a CSS transition." },
      ],
      "no-restricted-syntax": ["error", ...restrictedSyntax],
      "no-warning-comments": [
        "error",
        { terms: ["todo", "fixme", "xxx", "hack"], location: "start" },
      ],
      "prefer-arrow-callback": "error",
      "import/no-cycle": "error",
      "import/no-default-export": "error",
      "import/no-extraneous-dependencies": [
        "error",
        { devDependencies: ["*.config.{ts,mts,mjs,js}", "scripts/**", "**/*.test.{ts,tsx}"] },
      ],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/components",
              from: ["./src/app", "./src/features"],
              message: "Shared components stay domain-free; pass data in as props.",
            },
            {
              target: "./src/lib",
              from: ["./src/components", "./src/features", "./src/app"],
              message: "src/lib must not depend on UI or routes.",
            },
            {
              target: "./src/i18n",
              from: ["./src/components", "./src/features", "./src/app"],
              message: "src/i18n must not depend on UI or routes.",
            },
          ],
        },
      ],
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration", unnamedComponents: "arrow-function" },
      ],
      "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
      "react/jsx-no-literals": [
        "error",
        { noStrings: true, ignoreProps: true, allowedStrings: [" "] },
      ],
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
      "react/no-array-index-key": "error",
      "react/self-closing-comp": "error",
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/*.{ts,tsx}": "KEBAB_CASE", "scripts/**/*.mjs": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/app/**/": "NEXT_JS_APP_ROUTER_CASE", "src/!(app)/**/": "KEBAB_CASE" },
      ],
      "local/comment-hygiene": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...restrictedSyntax, ...sourceOnlySyntax] },
  },
  {
    files: ["src/env.ts"],
    rules: { "no-restricted-syntax": ["error", ...restrictedSyntax] },
  },
  {
    files: ["src/app/**/{page,layout}.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...restrictedSyntax,
        ...sourceOnlySyntax,
        {
          selector: "Program > ExpressionStatement[directive='use client']",
          message:
            "Pages and layouts stay Server Components; move the interactive part into a component in src/components.",
        },
      ],
    },
  },
  {
    files: ["src/lib/utils.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          ...restrictedImports,
          paths: restrictedImports.paths.filter(
            (path) => !["clsx", "tailwind-merge"].includes(path.name),
          ),
        },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "*.config.{ts,mts,mjs,js}"],
    rules: { "max-lines": "off" },
  },
  {
    // Node scripts have no "@/" alias, so they may import from parent folders.
    files: ["scripts/**/*.mjs"],
    rules: {
      "no-console": "off",
      "no-restricted-imports": [
        "error",
        {
          ...restrictedImports,
          patterns: restrictedImports.patterns.filter((pattern) => !pattern.group.includes("../*")),
        },
      ],
    },
  },
  {
    files: [NEXT_SPECIAL_FILES, "*.config.{ts,mts,mjs,js}"],
    rules: { "import/no-default-export": "off" },
  },
  {
    files: ["scripts/eslint/*.mjs"],
    rules: { "import/no-default-export": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
])
