import { planNeeds } from '~/coop/service'
import type { Need, Pin } from '~/coop/match'

/**
 * POST /api/coop/plan   { items: [{ id, name, search?, quantity, unit }], pins: { [pinKey]: Pin } }
 * Dry run: picks a Coop product per item and totals the cost. Does not touch the cart.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ items?: (Need & { id: string })[]; pins?: Record<string, Pin> }>(event)
  const items = body?.items
  if (!Array.isArray(items) || !items.length || items.length > 80) {
    throw createError({ statusCode: 400, message: 'items must be a list of 1–80 entries' })
  }
  const plan = await planNeeds(await getCoop(), items, body.pins ?? {})
  // echo the client's item id so the UI can match results to rows
  return { ...plan, picks: plan.picks.map((p, i) => ({ ...p, id: items[i].id })) }
})
