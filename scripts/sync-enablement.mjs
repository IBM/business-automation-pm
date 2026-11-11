// Syncs the Monday.com "Business Automation Enablement Tracker" board into src/enablement.json.
// Requires MONDAY_API_TOKEN. People columns are deliberately never requested.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const BOARD_ID = 18424069450
const OUTPUT = fileURLToPath(new URL("../src/enablement.json", import.meta.url))

const token = process.env.MONDAY_API_TOKEN
if (!token) {
  console.error("MONDAY_API_TOKEN is not set. Add it as a repository secret.")
  process.exit(1)
}

async function gql(query, variables = {}) {
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ query, variables }),
  })
  if (!response.ok)
    throw new Error(`Monday API returned HTTP ${response.status}`)
  const body = await response.json()
  if (body.errors)
    throw new Error(`Monday API error: ${JSON.stringify(body.errors)}`)
  return body.data
}

const ITEM_FIELDS = `
  id name group { title }
  column_values {
    id text
    ... on LinkValue { url }
    ... on MirrorValue { display_value }
    ... on BoardRelationValue { display_value }
  }`

const FIRST_PAGE = `query { boards(ids: [${BOARD_ID}]) { name items_page(limit: 100) { cursor items { ${ITEM_FIELDS} } } } }`
const NEXT_PAGE = `query ($cursor: String!) { next_items_page(limit: 100, cursor: $cursor) { cursor items { ${ITEM_FIELDS} } } }`

const board = (await gql(FIRST_PAGE)).boards[0]
if (!board)
  throw new Error(
    `Board ${BOARD_ID} not found or not accessible with this token`,
  )

const rawItems = [...board.items_page.items]
let cursor = board.items_page.cursor
while (cursor) {
  const page = (await gql(NEXT_PAGE, { cursor })).next_items_page
  rawItems.push(...page.items)
  cursor = page.cursor
}

const clean = (value) => (value ?? "").trim()

const items = rawItems.map((item) => {
  const columns = Object.fromEntries(
    item.column_values.map((column) => [column.id, column]),
  )
  const text = (id) => clean(columns[id]?.text)
  const mirrored = (id) =>
    clean(columns[id]?.display_value ?? columns[id]?.text)
  const record = {
    name: item.name,
    group: item.group.title,
    type: text("status"),
    product: text("dropdown_mm5p2m9j"),
    status: text("color_mm5p5a78"),
    date: text("date4"),
    quarter: text("dropdown_mm5pvb23"),
    audience: text("dropdown_mm5ptdpq"),
    link: clean(columns.link_mm5p13rs?.url),
    registration: mirrored("lookup_mm5pfv94"),
    time: mirrored("lookup_mm5p257d"),
    topic: mirrored("board_relation_mm5pwj7s"),
  }
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value))
})

const sortKey = (item) => item.date ?? "9999"
items.sort((a, b) =>
  sortKey(a) < sortKey(b)
    ? -1
    : sortKey(a) > sortKey(b)
      ? 1
      : a.name < b.name
        ? -1
        : a.name > b.name
          ? 1
          : 0,
)

if (items.length === 0)
  throw new Error(
    "Monday returned 0 items; refusing to overwrite the existing data",
  )

let previous = null
try {
  previous = JSON.parse(readFileSync(OUTPUT, "utf8"))
} catch {
  // First run or unreadable file: write a fresh one.
}

if (
  previous &&
  previous.boardName === board.name &&
  JSON.stringify(previous.items) === JSON.stringify(items)
) {
  console.log(`No changes (${items.length} items).`)
} else {
  const generatedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(
    OUTPUT,
    `${JSON.stringify({ boardName: board.name, generatedAt, items }, null, 1)}\n`,
  )
  console.log(`Wrote ${items.length} items to src/enablement.json`)
}
