import { pick, pinKey, type Need, type Pick, type Pin } from './match'
import type { CoopSession } from './session'

export const MIN_ORDER_CHF = 99.9
export const FREE_DELIVERY_CHF = 200

export type Plan = {
  picks: (Pick | { need: Need; notFound: true })[]
  total: number
  minOrder: number
  freeDeliveryFrom: number
}

/** Dry run: search each need, choose a product, compute packs and cost. Touches nothing in the cart. */
export async function planNeeds(session: CoopSession, needs: Need[], pins: Record<string, Pin> = {}): Promise<Plan> {
  const picks: Plan['picks'] = []
  for (const need of needs) {
    const pin = pins[pinKey(need.name)] ?? null
    const term = need.search?.trim() || pin?.search || need.name
    const p = pick(need, await session.search(term), pin)
    picks.push(p ?? { need, notFound: true })
  }
  const total = +picks.reduce((s, p) => s + ('cost' in p ? p.cost : 0), 0).toFixed(2)
  return { picks, total, minOrder: MIN_ORDER_CHF, freeDeliveryFrom: FREE_DELIVERY_CHF }
}
