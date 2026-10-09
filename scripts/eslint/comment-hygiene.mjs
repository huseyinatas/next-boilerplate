// Only high-precision patterns live here; fuzzier comment problems are review items (REVIEW.md).
const checks = [
  ["divider", /^(?:[-=*#~_/]\s?){4,}$|^[-=*#]{3,}.+[-=*#]{3,}$/],
  [
    "sectionLabel",
    /^(?:imports?|types?|interfaces?|constants?|state|hooks?|effects?|handlers?|helpers?|utils?|render|exports?|main|component|styles?)$/i,
  ],
  [
    "narration",
    /^(?:this|the following) (?:function|component|hook|method|class|module|file|helper|utility|code|block)\b.*\b(?:is|will|handles?|renders?|returns?|creates?|defines?|checks?|gets?|sets?|takes?|uses?)\b|^(?:here|now|first|next|then),? we\b/i,
  ],
  [
    "history",
    /^step \d+\b|\b(?:as requested|as you asked|per your request|as discussed|as mentioned (?:above|earlier)|per the (?:task|ticket|instructions))\b/i,
  ],
  ["jsdocType", /@(?:param|returns?|type|typedef)\s*\{/],
  ["emoji", /(?![©®™])\p{Extended_Pictographic}/u],
]

const commentHygiene = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow comments that narrate code, label sections or record task history",
    },
    schema: [],
    messages: {
      divider: "Remove divider comments; let the code's structure show the sections.",
      sectionLabel:
        "Remove section-label comments such as `// Imports` or `// State`; the code already shows this.",
      narration:
        "This comment narrates what the code does. Delete it, or rewrite it to explain a reason the code cannot show.",
      history:
        "Comments explain why the code is this way; task notes belong in the commit message.",
      jsdocType: "Remove the {Type} from JSDoc; TypeScript already declares it.",
      emoji: "No emoji in comments.",
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type === "Shebang") continue
          const lines = comment.value
            .split("\n")
            .map((line) => line.replace(/^\s*\*?\s?/, "").trim())
            .filter(Boolean)
          const hit = checks.find(([, pattern]) => lines.some((line) => pattern.test(line)))
          if (hit) context.report({ loc: comment.loc, messageId: hit[0] })
        }
      },
    }
  },
}

export default commentHygiene
