/**
 * POST /api/coop/translate   { names: string[] } -> { terms: { [name]: germanSearchTerm } }
 * Coop's search is German; Mise ingredients are usually English. Needs ANTHROPIC_API_KEY (optional; 501 without it).
 */
export default defineEventHandler(async (event) => {
  const key = useRuntimeConfig().anthropicApiKey
  if (!key) throw createError({ statusCode: 501, message: 'ANTHROPIC_API_KEY not set' })
  const { names } = await readBody<{ names?: string[] }>(event)
  if (!Array.isArray(names) || !names.length || names.length > 80) throw createError({ statusCode: 400, message: 'names must be 1–80 strings' })

  const res = await $fetch<any>('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: {
      model: 'claude-haiku-5-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content:
          'Translate these grocery ingredients into the short German search term you would type into the Swiss Coop online shop (singular/plural as a shopper would, no quantities, no adjectives like "chopped"). ' +
          'Reply with ONLY a JSON object mapping each input string to its German term.\n' + JSON.stringify(names),
      }],
    },
  })
  const raw: string = res?.content?.[0]?.text ?? ''
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  try {
    return { terms: JSON.parse(json) as Record<string, string> }
  } catch {
    throw createError({ statusCode: 502, message: 'Could not parse translation response' })
  }
})
