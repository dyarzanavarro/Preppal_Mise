// MCP server for Coop at Home. stdio transport. Needs the shared Chrome from `npm run coop:chrome`.
// No checkout/payment tool exists on purpose: the agent fills the cart, you pay.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { CoopNotConnected, CoopSession } from './session'
import { planNeeds } from './service'
import { readPins, writePin } from './pins-file'

let session: CoopSession | null = null
async function coop(): Promise<CoopSession> {
  if (!session || !session.connected) session = await CoopSession.connect()
  return session
}

const text = (v: unknown) => ({ content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v, null, 2) }] })
const fail = (e: unknown) => ({ isError: true, ...text(e instanceof Error ? e.message : String(e)) })
const safe = <A>(fn: (a: A) => Promise<unknown>) => async (a: A) => { try { return text(await fn(a)) } catch (e) { return fail(e) } }

const server = new McpServer({ name: 'coop-at-home', version: '0.1.0' })

server.registerTool(
  'coop_status',
  { description: 'Check the connection to Chrome and whether you are logged in to coop.ch.', annotations: { readOnlyHint: true } },
  async () => {
    try {
      const s = await coop()
      return text({ connected: true, loggedIn: await s.isLoggedIn() })
    } catch (e) {
      return e instanceof CoopNotConnected ? text({ connected: false, hint: e.message }) : fail(e)
    }
  },
)

server.registerTool(
  'coop_search',
  {
    description:
      'Search Coop products (top 5). Use GERMAN search terms: English ones return junk ("spinach" finds falafel, "red onion" finds nothing). Returns code, title, pack size, price in CHF.',
    inputSchema: { query: z.string().describe('German search term, e.g. "Kichererbsen"') },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ query }) => (await (await coop()).search(query)).map((p) => ({ code: p.code, title: p.title, packSize: p.capacity && `${p.capacity}${p.baseUnit}`, priceChf: p.price, purchasable: p.purchasable }))),
)

server.registerTool(
  'coop_plan',
  {
    description:
      'Dry run: for each ingredient pick a Coop product, compute how many packs cover the quantity, and total the cost. Does NOT touch the cart. Show the result to the user before coop_add_to_cart. Pinned products (coop_pin) win over cheapest match.',
    inputSchema: {
      items: z.array(z.object({
        name: z.string().describe('Ingredient name, used as the pin key'),
        search: z.string().optional().describe('German Coop search term; defaults to name'),
        quantity: z.union([z.string(), z.number()]).describe('e.g. 400, "1/2", "2-3"'),
        unit: z.string().describe('g, kg, ml, l, tbsp, tsp, or "" for pieces'),
      })),
    },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ items }) => planNeeds(await coop(), items, readPins())),
)

server.registerTool(
  'coop_add_to_cart',
  {
    description:
      'Add products to the real Coop cart. Use codes and packs from coop_plan, after the user agreed. Refuses if the cost of these lines exceeds max_total_chf. Cannot check out or pay; tell the user to review and pay (TWINT) at https://www.coop.ch/de/cart.',
    inputSchema: {
      lines: z.array(z.object({ code: z.string(), packs: z.number().int().min(1).max(20), priceChf: z.number().describe('unit price from the plan, for the guard') })),
      max_total_chf: z.number().default(250),
    },
  },
  safe(async ({ lines, max_total_chf }) => {
    const est = +lines.reduce((s, l) => s + l.priceChf * l.packs, 0).toFixed(2)
    if (est > max_total_chf) throw new Error(`Estimated ${est} CHF exceeds max_total_chf ${max_total_chf}. Nothing added.`)
    const s = await coop()
    if (!(await s.isLoggedIn())) throw new Error('Not logged in to coop.ch in the shared Chrome.')
    return { ...(await s.addAll(lines)), cartUrl: 'https://www.coop.ch/de/cart' }
  }),
)

server.registerTool(
  'coop_pin',
  {
    description: 'Remember which product to always buy for an ingredient. The code must be in the top 5 results for `search`.',
    inputSchema: { ingredient: z.string(), search: z.string().describe('German search term'), code: z.string() },
  },
  safe(async ({ ingredient, search, code }) => {
    const product = (await (await coop()).search(search)).find((p) => p.code === code)
    if (!product) throw new Error(`${code} is not in the top results for "${search}"`)
    writePin(ingredient, { search, product })
    return { pinned: ingredient, product: product.title }
  }),
)

server.registerTool(
  'coop_list_pins',
  { description: 'List remembered ingredient → product choices.', annotations: { readOnlyHint: true } },
  async () => text(readPins()),
)

await server.connect(new StdioServerTransport())
