import { notFound } from "next/navigation"

// Unmatched paths would otherwise skip the [lang] layout and show the framework's
// unlocalized 404; routing them here renders [lang]/not-found.tsx instead.
export default function UnmatchedPage() {
  notFound()
}
