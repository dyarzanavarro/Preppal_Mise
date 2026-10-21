/**
 * POST /api/coop/add-to-cart   { lines: [{ code, packs, priceChf }], maxTotal?: number }
 * Adds the confirmed plan lines to the real Coop cart. Never checks out: the user pays on coop.ch.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ lines?: { code: string; packs: number; priceChf: number }[]; maxTotal?: number }>(event)
  const lines = body?.lines
  if (!Array.isArray(lines) || !lines.length || lines.length > 80) {
    throw createError({ statusCode: 400, message: 'lines must be a list of 1–80 entries' })
  }
  if (lines.some((l) => !/^\d+$/.test(l.code) || !Number.isInteger(l.packs) || l.packs < 1 || l.packs > 20)) {
    throw createError({ statusCode: 400, message: 'each line needs a numeric code and packs between 1 and 20' })
  }
  const est = +lines.reduce((s, l) => s + l.priceChf * l.packs, 0).toFixed(2)
  const max = body.maxTotal ?? 300
  if (est > max) throw createError({ statusCode: 400, message: `Estimated CHF ${est} exceeds the limit of CHF ${max}. Nothing added.` })

  const coop = await getCoop()
  if (!(await coop.isLoggedIn())) throw createError({ statusCode: 401, message: 'Not logged in to coop.ch in the shared Chrome window.' })
  return coop.addAll(lines.map(({ code, packs }) => ({ code, packs })))
})
