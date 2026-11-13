// Syncs the IBM Business Automation YouTube playlist into src/businessAutomationPlaylist.json.
// Recommended videos are pinned and never changed. Videos new to the playlist are inserted right after
// them (in playlist order) with an `addedAt` date, which the Videos page uses to show a "New" indicator.
// Videos removed from the playlist are dropped, except recommended ones.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const PLAYLIST_ID = "PL_4RxtD-BL5vuomQEnSVy1qoWY5FOG0Aw"
const OUTPUT = fileURLToPath(
  new URL("../src/businessAutomationPlaylist.json", import.meta.url),
)

const response = await fetch(
  `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`,
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Cookie: "SOCS=CAI; CONSENT=YES+1",
    },
  },
)
if (!response.ok) throw new Error(`YouTube returned HTTP ${response.status}`)
const html = await response.text()

const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)
if (!match) throw new Error("Could not find ytInitialData in the playlist page")
const data = JSON.parse(match[1])

const fetched = []
const walk = (node) => {
  if (Array.isArray(node)) return node.forEach(walk)
  if (!node || typeof node !== "object") return
  const lockup = node.lockupViewModel
  if (lockup?.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
    const title = lockup.metadata?.lockupMetadataViewModel?.title?.content
    const duration = JSON.stringify(lockup.contentImage ?? {}).match(
      /"text":"(\d+:\d+(?::\d+)?)"/,
    )?.[1]
    if (lockup.contentId && title && duration)
      fetched.push({ id: lockup.contentId, title, duration })
  }
  Object.values(node).forEach(walk)
}
walk(data)

if (fetched.length === 0)
  throw new Error("Found 0 videos; refusing to overwrite the existing data")

const previous = JSON.parse(readFileSync(OUTPUT, "utf8"))
const inPlaylist = new Set(fetched.map((video) => video.id))
const known = new Set(previous.videos.map((video) => video.id))

const kept = previous.videos.filter(
  (video) => video.recommended || inPlaylist.has(video.id),
)
const today = new Date().toISOString().slice(0, 10)
const added = fetched
  .filter((video) => !known.has(video.id))
  .map((video) => ({ ...video, addedAt: today }))

let lastRecommended = -1
kept.forEach((video, index) => {
  if (video.recommended) lastRecommended = index
})
const videos = [
  ...kept.slice(0, lastRecommended + 1),
  ...added,
  ...kept.slice(lastRecommended + 1),
]

if (JSON.stringify(videos) === JSON.stringify(previous.videos)) {
  console.log(`No changes (${videos.length} videos).`)
} else {
  const lines = videos.map((video) => `  ${JSON.stringify(video)}`)
  writeFileSync(
    OUTPUT,
    `{\n "generatedAt": "${today}",\n "videos": [\n${lines.join(",\n")}\n ]\n}\n`,
  )
  console.log(
    `Wrote ${videos.length} videos (${added.length} new, ${previous.videos.length - kept.length} removed).`,
  )
}
