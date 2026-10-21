export type Product = {
  code: string
  title: string
  brand: string
  price: number
  capacity: number | null // in base unit (g or ml)
  baseUnit: 'g' | 'ml' | null
  purchasable: boolean
}

// Mise stores quantity as a free-text string ("1/2", "2-3", "1 1/2") and unit as free text.
export type Need = { name: string; search?: string; quantity: string | number; unit: string }

export type Pick = {
  need: Need
  search: string // the term actually used on Coop
  product: Product
  packs: number
  cost: number
  review: string | null // non-null => human should check
  alternatives: Product[]
}

// ingredient -> pinned choice. `search` is the Coop (German) term that found it.
export type Pin = { search: string; product: Product }

export const pinKey = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ')

const VULGAR: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }

export function parseQuantity(q: string | number | null | undefined): number | null {
  if (typeof q === 'number') return Number.isFinite(q) ? q : null
  let s = (q ?? '').toString().trim().toLowerCase().replace(',', '.')
  if (!s) return null
  for (const [ch, v] of Object.entries(VULGAR)) s = s.replace(ch, ` ${v} `)
  const range = s.split(/\s*(?:-|–|to)\s*/) // "2-3" -> take the upper bound, we'd rather over-buy
  const last = range[range.length - 1]
  const parts = last.trim().split(/\s+/)
  let total = 0
  for (const part of parts) {
    const frac = /^(\d+)\/(\d+)$/.exec(part)
    const n = frac ? Number(frac[1]) / Number(frac[2]) : Number(part)
    if (!Number.isFinite(n)) return null
    total += n
  }
  return total
}

// unit -> [base unit, factor]. tsp/tbsp/cup are volumes so "2 tbsp olive oil" can be compared to a 500 ml bottle.
const TO_BASE: Record<string, ['g' | 'ml', number]> = {
  g: ['g', 1], gr: ['g', 1], gram: ['g', 1], grams: ['g', 1], kg: ['g', 1000], kilogram: ['g', 1000],
  ml: ['ml', 1], cl: ['ml', 10], dl: ['ml', 100], l: ['ml', 1000], liter: ['ml', 1000], litre: ['ml', 1000], liters: ['ml', 1000], litres: ['ml', 1000],
  tsp: ['ml', 5], teaspoon: ['ml', 5], teaspoons: ['ml', 5], tbsp: ['ml', 15], tablespoon: ['ml', 15], tablespoons: ['ml', 15],
  cup: ['ml', 240], cups: ['ml', 240],
}

// Units that mean "this many packs/items".
const COUNT_UNITS = new Set(['', 'x', 'pc', 'pcs', 'piece', 'pieces', 'stück', 'stk', 'whole', 'large', 'medium', 'small', 'can', 'cans', 'tin', 'tins', 'jar', 'jars', 'bottle', 'bottles', 'pack', 'packs', 'packet', 'packets', 'bunch', 'bunches'])

export function normalizeUnit(qty: number, unit: string | null | undefined): { qty: number; base: 'g' | 'ml' } | null {
  const m = TO_BASE[(unit ?? '').trim().toLowerCase()]
  return m ? { qty: qty * m[1], base: m[0] } : null
}

// Raw suggestlayer result -> Product. Shape taken from the captured HAR.
export function toProduct(r: any): Product {
  const cap = normalizeUnit(Number(r.netCapacity), r.contentUnit)
  return {
    code: String(r.code),
    title: r.title ?? r.name,
    brand: r.brandName ?? '',
    price: r.price.value,
    capacity: cap && Number.isFinite(cap.qty) ? cap.qty : null,
    baseUnit: cap?.base ?? null,
    purchasable: r.purchasable === true && r.available !== false,
  }
}

const tokens = (s: string) => s.toLowerCase().split(/[^a-zäöüéèà0-9]+/).filter((t) => t.length > 2)

function packsFor(need: Need, p: Product): { packs: number; cost: number; note: string | null } {
  const qty = parseQuantity(need.quantity)
  const unit = (need.unit ?? '').trim().toLowerCase()
  const n = qty != null ? normalizeUnit(qty, unit) : null
  let packs: number
  let note: string | null = null
  if (qty == null) {
    packs = 1
    note = `couldn't read quantity "${need.quantity}", assuming 1 pack`
  } else if (n && p.capacity && p.baseUnit === n.base) {
    packs = Math.max(1, Math.ceil(n.qty / p.capacity - 1e-9))
  } else if (COUNT_UNITS.has(unit)) {
    packs = Math.max(1, Math.ceil(qty - 1e-9))
  } else {
    packs = 1
    note = `can't compare ${need.quantity} ${need.unit} with the pack size, assuming 1 pack`
  }
  return { packs, cost: +(packs * p.price).toFixed(2), note }
}

export function pick(need: Need, candidates: Product[], pin?: Pin | null): Pick | null {
  const search = need.search?.trim() || pin?.search || need.name
  const common = (p: Product, packsInfo: ReturnType<typeof packsFor>, review: string | null, alternatives: Product[]): Pick => ({
    need, search, product: p, packs: packsInfo.packs, cost: packsInfo.cost, review: review ?? packsInfo.note, alternatives,
  })

  if (pin) {
    const live = candidates.find((c) => c.code === pin.product.code)
    // fresh price/availability if the pinned item is in the results, else the cached snapshot
    const p = live ?? pin.product
    if (p.purchasable) {
      return common(p, packsFor(need, p), live ? null : 'pinned product not in search results, price from cache', candidates.filter((c) => c.code !== p.code).slice(0, 3))
    }
  }

  const buyable = candidates.filter((p) => p.purchasable)
  if (!buyable.length) return null
  const want = tokens(search)
  const relevant = buyable.filter((p) => want.some((w) => tokens(p.title).some((t) => t.includes(w) || w.includes(t))))
  const pool = relevant.length ? relevant : buyable

  // cheapest total first, then fewest packs
  const scored = pool.map((p) => ({ p, ...packsFor(need, p) })).sort((a, b) => a.cost - b.cost || a.packs - b.packs)
  const best = scored[0]
  return common(best.p, best, !relevant.length ? 'no title match, took cheapest result' : null, scored.slice(1, 4).map((s) => s.p))
}
