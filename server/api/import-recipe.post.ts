import { createError } from 'h3'
import type { ImportedRecipe, Ingredient } from '~/types'

// ── ISO 8601 duration → human-readable ─────────────────────────────────────
// e.g. "PT1H30M" → "1h 30m",  "PT20M" → "20 mins"
function parseDuration(iso?: string): string | undefined {
  if (!iso) return undefined
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return undefined
  const h = match[1] ? `${match[1]}h ` : ''
  const m = match[2] ? `${match[2]} mins` : ''
  return (h + m).trim() || undefined
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags and decode common entities */
function stripHtml(str: string): string {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Coerce a recipeIngredient item to a plain string.
 * Some sites emit structured objects instead of strings.
 */
function coerceIngredient(item: unknown): string {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object') {
    const o = item as Record<string, any>
    // HowToIngredient / custom structured data
    const qty = o.requiredQuantity ?? o.amount ?? o.quantity ?? ''
    const name = o.name ?? o.text ?? ''
    return [String(qty), String(name)].filter(Boolean).join(' ')
  }
  return String(item ?? '')
}

// Known units — order matters: longer alternatives first to avoid prefix matching
const UNITS =
  'tablespoons?|teaspoons?|cups?|ounces?|pounds?|grams?|litres?|liters?|' +
  'tbsp|tsp|oz|lbs?|kg|ml|cl|dl|l|g|' +
  'bunches|bunch|cloves?|slices?|pieces?|cans?|packs?|' +
  'pinch(?:es)?|dash(?:es)?|handfuls?|sprigs?|stalks?|heads?|' +
  'large|medium|small'

const UNIT_RE = new RegExp(`^(${UNITS})(?=\\s|,|$)`, 'i')

// ── Step-by-step ingredient parser ───────────────────────────────────────────
function parseIngredientText(raw: unknown): Ingredient {
  const text = stripHtml(coerceIngredient(raw))
  if (!text) return { quantity: '', unit: '', name: '' }

  // Step 1 — leading quantity: digits, fractions (Unicode + ASCII), decimals, ranges
  const qtyMatch = text.match(
    /^([\d¼½¾⅓⅔⅛⅜⅝⅞]+(?:[\/\-\.][\d¼½¾⅓⅔⅛⅜⅝⅞]+)?(?:\s[\d¼½¾⅓⅔⅛⅜⅝⅞]+(?:[\/\-\.][\d¼½¾⅓⅔⅛⅜⅝⅞]+)?)?)\s*/,
  )

  if (!qtyMatch) {
    // No leading number — whole string is the ingredient name
    return { quantity: '', unit: '', name: text }
  }

  const quantity = qtyMatch[1].trim()
  const afterQty = text.slice(qtyMatch[0].length)

  // Step 2 — optional unit immediately after quantity
  const unitMatch = afterQty.match(UNIT_RE)

  if (unitMatch) {
    const unit = unitMatch[1].trim()
    const afterUnit = afterQty.slice(unitMatch[0].length).trim()
    // name: whatever follows the unit, falling back to full text if empty
    const name = afterUnit || text
    return { quantity, unit, name }
  }

  // No unit — everything after the quantity is the name
  const name = afterQty.trim() || text
  return { quantity, unit: '', name }
}

// ── Main handler ────────────────────────────────────────────────────────────

export default defineEventHandler(async (event): Promise<ImportedRecipe> => {
  const body = await readBody<{ url: string }>(event)
  const { url } = body ?? {}

  if (!url || !url.startsWith('http')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  // Fetch the page server-side (no CORS issues)
  let html: string
  try {
    html = await $fetch<string>(url, {
      responseType: 'text',   // ← force raw string; prevents ofetch auto-parsing HTML
      headers: {
        // Use a real browser UA — many recipe blogs block bot-looking strings
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Could not fetch the page. The site may block bots.',
    })
  }

  // ── Extract JSON-LD blocks ─────────────────────────────────────────────
  // Matches type with double quotes, single quotes, or no quotes
  const jsonLdRegex = /<script[^>]+type=['"]?application\/ld\+json['"]?[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  let recipeSchema: any = null

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      // Some sites HTML-encode ampersands inside JSON-LD; decode before parsing
      const raw = match[1]
        .trim()
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')

      const parsed = JSON.parse(raw)
      // Handle bare objects, @graph arrays, and arrays of schemas
      const candidates: any[] = Array.isArray(parsed)
        ? parsed
        : [parsed, ...(parsed['@graph'] ?? [])]

      for (const c of candidates) {
        const type = c['@type']
        if (
          type === 'Recipe' ||
          (Array.isArray(type) && type.includes('Recipe')) ||
          (typeof type === 'string' && type.includes('Recipe'))
        ) {
          recipeSchema = c
          break
        }

      }
    } catch {
      // Malformed JSON-LD — skip
    }
    if (recipeSchema) break
  }

  if (!recipeSchema) {

    throw createError({
      statusCode: 422,
      statusMessage: 'No JSON-LD Recipe schema found on this page.',
    })


  }

  // ── Map schema.org Recipe → our type ─────────────────────────────────────

  const rawIngredients: unknown[] = Array.isArray(recipeSchema.recipeIngredient)
    ? recipeSchema.recipeIngredient
    : []

  // DEBUG — remove once ingredient names are confirmed working
  console.log('[import-recipe] raw (first 5):',
    JSON.stringify(rawIngredients.slice(0, 5), null, 2))

  const ingredients: Ingredient[] = rawIngredients.map(parseIngredientText)

  console.log('[import-recipe] parsed (first 5):',
    JSON.stringify(ingredients.slice(0, 5), null, 2))

  // servings: could be a string like "4 servings" or a number
  let servings: number | undefined
  const rawYield = recipeSchema.recipeYield
  if (typeof rawYield === 'number') {
    servings = rawYield
  } else if (typeof rawYield === 'string') {
    const n = parseInt(rawYield)
    if (!isNaN(n)) servings = n
  } else if (Array.isArray(rawYield) && rawYield.length > 0) {
    const n = parseInt(String(rawYield[0]))
    if (!isNaN(n)) servings = n
  }

  // image: can be a string, an ImageObject, or an array of either
  let imageUrl: string | undefined
  const img = recipeSchema.image
  if (typeof img === 'string') imageUrl = img
  else if (Array.isArray(img)) imageUrl = typeof img[0] === 'string' ? img[0] : img[0]?.url
  else if (img?.url) imageUrl = img.url

  const result: ImportedRecipe = {
    name: recipeSchema.name ?? 'Untitled Recipe',
    description: recipeSchema.description,
    servings,
    prepTime: parseDuration(recipeSchema.prepTime),
    cookTime: parseDuration(recipeSchema.cookTime),
    ingredients,
    imageUrl,
    sourceUrl: url,
  }

  return result
})
