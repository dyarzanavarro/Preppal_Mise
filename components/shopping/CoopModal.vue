<script setup lang="ts">
import type { ShoppingItem } from '~/types'
import type { Pin, Product } from '~/coop/match'
import { pinKey } from '~/coop/match'

const props = defineProps<{ items: ShoppingItem[] }>()
const emit = defineEmits<{ close: [] }>()

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'checking' | 'setup' | 'terms' | 'planning' | 'review' | 'adding' | 'done' | 'error'

interface Line {
  id: string
  name: string
  quantity: string
  unit: string
  search: string
  product?: Product
  packs: number
  review: string | null
  alternatives: Product[]
  notFound: boolean
  pinned: boolean
  include: boolean
}

// ── State ─────────────────────────────────────────────────────────────────────

const { load: loadPins, save: savePin } = useCoopPins()

const stage    = ref<Stage>('checking')
const errorMsg = ref('')
const setupHint = ref('')
const lines    = ref<Line[]>([])
const pins     = ref<Record<string, Pin>>({})
const minOrder = ref(99.9)
const freeFrom = ref(200)
const addResult = ref<{ results: { code: string; packs: number; ok: boolean; error?: string }[]; cartTotal: number | null } | null>(null)

// Only unchecked items go to Coop (what's still needed)
const toBuy = computed(() => props.items.filter((i) => !i.checked))

const active = computed(() => lines.value.filter((l) => l.include && l.product))
const total = computed(() => +active.value.reduce((s, l) => s + l.product!.price * l.packs, 0).toFixed(2))

function errText(e: any) {
  return e?.data?.message ?? e?.message ?? 'Something went wrong.'
}

// ── 1. Connection check ───────────────────────────────────────────────────────

async function checkConnection() {
  stage.value = 'checking'
  const s = await $fetch<{ connected: boolean; loggedIn: boolean; hint?: string }>('/api/coop/status')
  if (!s.connected || !s.loggedIn) {
    setupHint.value = s.connected ? 'Chrome is running but you are not logged in to coop.ch.' : (s.hint ?? '')
    stage.value = 'setup'
    return
  }
  await prepareTerms()
}

// ── 2. German search terms (Coop's search is German) ─────────────────────────

async function prepareTerms() {
  pins.value = await loadPins().catch(() => ({}))
  lines.value = toBuy.value.map((i) => {
    const pin = pins.value[pinKey(i.name)]
    return {
      id: i.id, name: i.name, quantity: i.quantity, unit: i.unit,
      search: pin?.search ?? i.name,
      packs: 1, review: null, alternatives: [], notFound: false, pinned: !!pin, include: true,
    }
  })
  // Translate only what isn't pinned. 501 = no API key configured: keep the original names, user can edit.
  const untranslated = lines.value.filter((l) => !l.pinned)
  if (untranslated.length) {
    try {
      const { terms } = await $fetch<{ terms: Record<string, string> }>('/api/coop/translate', {
        method: 'POST',
        body: { names: untranslated.map((l) => l.name) },
      })
      for (const l of untranslated) l.search = terms[l.name] ?? l.name
    } catch { /* optional */ }
  }
  stage.value = 'terms'
}

// ── 3. Plan (dry run) ─────────────────────────────────────────────────────────

async function findProducts() {
  stage.value = 'planning'
  try {
    const data = await $fetch<{ picks: any[]; minOrder: number; freeDeliveryFrom: number }>('/api/coop/plan', {
      method: 'POST',
      body: {
        items: lines.value.map((l) => ({ id: l.id, name: l.name, search: l.search, quantity: l.quantity, unit: l.unit })),
        pins: pins.value,
      },
    })
    minOrder.value = data.minOrder
    freeFrom.value = data.freeDeliveryFrom
    for (const p of data.picks) {
      const l = lines.value.find((x) => x.id === p.id)!
      if (p.notFound) { l.notFound = true; l.include = false; l.product = undefined; continue }
      l.notFound = false
      l.include = true
      l.product = p.product
      l.packs = p.packs
      l.review = p.review
      l.alternatives = p.alternatives
    }
    stage.value = 'review'
  } catch (e) {
    errorMsg.value = errText(e)
    stage.value = 'error'
  }
}

function choose(l: Line, product: Product) {
  l.alternatives = [l.product!, ...l.alternatives.filter((a) => a.code !== product.code)]
  l.product = product
  l.pinned = false
  l.review = 'changed by you: check pack count'
}

async function pin(l: Line) {
  if (!l.product) return
  const p: Pin = { search: l.search, product: l.product }
  await savePin(l.name, p)
  pins.value[pinKey(l.name)] = p
  l.pinned = true
}

// ── 4. Add to cart ────────────────────────────────────────────────────────────

async function addToCart() {
  stage.value = 'adding'
  try {
    addResult.value = await $fetch('/api/coop/add-to-cart', {
      method: 'POST',
      body: { lines: active.value.map((l) => ({ code: l.product!.code, packs: l.packs, priceChf: l.product!.price })) },
    })
    stage.value = 'done'
  } catch (e) {
    errorMsg.value = errText(e)
    stage.value = 'error'
  }
}

const failed = computed(() => addResult.value?.results.filter((r) => !r.ok) ?? [])

onMounted(() => checkConnection().catch((e) => { errorMsg.value = errText(e); stage.value = 'error' }))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 bg-ink/60 flex items-end md:items-center justify-center p-0 md:p-4"
      @click.self="emit('close')">

      <div class="w-full md:max-w-3xl max-h-[92dvh] flex flex-col border-2 border-ink bg-[color:var(--paper)] shadow-[8px_8px_0_#111111] overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b-2 border-ink bg-cream shrink-0">
          <div>
            <p class="editorial-kicker mb-1">Coop at Home</p>
            <h2 class="font-display text-3xl uppercase">Send to Cart</h2>
          </div>
          <button @click="emit('close')" class="brutalist-btn text-sm px-3 py-1.5">✕</button>
        </div>

        <!-- CHECKING / PLANNING / ADDING -->
        <div v-if="stage === 'checking' || stage === 'planning' || stage === 'adding'"
             class="flex-1 flex flex-col items-center justify-center p-10 space-y-4 text-center">
          <div class="font-display text-7xl animate-pulse">🛒</div>
          <h3 class="font-display text-3xl uppercase">
            {{ stage === 'checking' ? 'Connecting…' : stage === 'planning' ? 'Finding products…' : 'Adding to cart…' }}
          </h3>
          <p v-if="stage !== 'checking'" class="text-sm uppercase tracking-[0.06em] text-ink/60 max-w-xs">
            About 1–2 seconds per item. Requests are paced on purpose.
          </p>
        </div>

        <!-- SETUP -->
        <div v-else-if="stage === 'setup'" class="flex-1 overflow-y-auto p-5 space-y-4">
          <div class="border-2 border-ink bg-brand-500 px-4 py-3">
            <p class="font-display text-xl uppercase mb-1">Coop isn't connected</p>
            <p class="text-sm">{{ setupHint }}</p>
          </div>
          <ol class="text-sm space-y-2 list-decimal pl-5">
            <li>In a terminal in the Mise folder run <code class="bg-cream border-2 border-ink px-1 text-xs">npm run coop:chrome</code></li>
            <li>Log in to coop.ch in the Chrome window that opens (Supercard ID). Leave it running.</li>
            <li>Come back here and press Retry.</li>
          </ol>
        </div>

        <!-- TERMS -->
        <div v-else-if="stage === 'terms'" class="flex-1 overflow-y-auto p-5 space-y-4">
          <p class="text-sm uppercase tracking-[0.06em] text-ink/70">
            {{ lines.length }} item{{ lines.length !== 1 ? 's' : '' }} still to buy. Coop searches in German; edit the search term if needed.
          </p>
          <div class="border-2 border-ink divide-y-2 divide-ink bg-white">
            <div v-for="l in lines" :key="l.id" class="px-3 py-2 flex items-center gap-3 text-sm">
              <div class="w-1/2 min-w-0">
                <span class="font-medium">{{ l.name }}</span>
                <span v-if="l.quantity || l.unit" class="text-ink/50 text-xs ml-2">{{ [l.quantity, l.unit].filter(Boolean).join(' ') }}</span>
              </div>
              <input v-model="l.search" class="w-1/2 border-2 border-ink px-2 py-1 text-sm" :aria-label="`Coop search term for ${l.name}`" />
              <span v-if="l.pinned" title="Pinned product">📌</span>
            </div>
            <div v-if="!lines.length" class="px-3 py-3 text-sm uppercase tracking-[0.06em] text-ink/40">All items are already checked off.</div>
          </div>
        </div>

        <!-- REVIEW -->
        <div v-else-if="stage === 'review'" class="flex-1 overflow-y-auto p-5 space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="editorial-kicker">CHF {{ total.toFixed(2) }}</span>
            <span v-if="total < minOrder" class="editorial-kicker bg-brand-500">⚠️ Below minimum order CHF {{ minOrder.toFixed(2) }}</span>
            <span v-else-if="total < freeFrom" class="editorial-kicker">Free delivery from CHF {{ freeFrom.toFixed(0) }}</span>
          </div>

          <div class="border-2 border-ink divide-y-2 divide-ink bg-white">
            <div v-for="l in lines" :key="l.id" class="px-3 py-2 text-sm space-y-1" :class="{ 'opacity-50': !l.include }">
              <div class="flex items-start gap-3">
                <input type="checkbox" v-model="l.include" :disabled="l.notFound" class="mt-1" :aria-label="`Include ${l.name}`" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="font-medium">{{ l.name }}
                      <span v-if="l.quantity || l.unit" class="text-ink/50 text-xs">{{ [l.quantity, l.unit].filter(Boolean).join(' ') }}</span>
                    </span>
                    <span v-if="l.product" class="shrink-0">CHF {{ (l.product.price * l.packs).toFixed(2) }}</span>
                  </div>
                  <p v-if="l.notFound" class="text-xs text-ink/60 italic">Nothing found for "{{ l.search }}". Edit the term and search again.</p>
                  <template v-else-if="l.product">
                    <p class="text-ink/70 text-xs">→ {{ l.product.title }}
                      <span v-if="l.product.capacity">({{ l.product.capacity }}{{ l.product.baseUnit }})</span>
                      · CHF {{ l.product.price.toFixed(2) }}
                    </p>
                    <p v-if="l.review" class="text-xs italic text-ink/60">⚠️ {{ l.review }}</p>
                    <div class="flex flex-wrap items-center gap-2 pt-1">
                      <label class="text-xs flex items-center gap-1">packs
                        <input type="number" min="1" max="20" v-model.number="l.packs" class="w-14 border-2 border-ink px-1 py-0.5 text-sm" />
                      </label>
                      <select v-if="l.alternatives.length" class="border-2 border-ink px-1 py-0.5 text-xs max-w-[14rem]"
                              @change="choose(l, l.alternatives.find(a => a.code === ($event.target as HTMLSelectElement).value)!)">
                        <option value="">other options…</option>
                        <option v-for="a in l.alternatives" :key="a.code" :value="a.code">
                          {{ a.title }} {{ a.capacity ?? '' }}{{ a.baseUnit ?? '' }} · {{ a.price.toFixed(2) }}
                        </option>
                      </select>
                      <button v-if="!l.pinned" @click="pin(l)" class="brutalist-btn text-xs px-2 py-0.5">📌 Always buy this</button>
                      <span v-else class="text-xs">📌 pinned</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DONE -->
        <div v-else-if="stage === 'done'" class="flex-1 overflow-y-auto p-5 space-y-4">
          <div class="flex flex-wrap gap-2">
            <span class="editorial-kicker bg-green-100 text-green-900">✅ {{ (addResult?.results.length ?? 0) - failed.length }} added</span>
            <span v-if="failed.length" class="editorial-kicker bg-brand-500">❌ {{ failed.length }} failed</span>
            <span v-if="addResult?.cartTotal != null" class="editorial-kicker">Cart now CHF {{ addResult.cartTotal.toFixed(2) }}</span>
          </div>
          <p class="text-sm uppercase tracking-[0.06em] text-ink/60">
            Review your cart, pick a delivery slot and pay with TWINT on
            <a href="https://www.coop.ch/de/cart" target="_blank" class="underline hover:text-brand-500 transition-colors">coop.ch</a>.
            Items were added to the cart, not ordered.
          </p>
          <ul v-if="failed.length" class="border-2 border-ink divide-y-2 divide-ink bg-white text-sm">
            <li v-for="f in failed" :key="f.code" class="px-3 py-2">Product {{ f.code }}: {{ f.error }}</li>
          </ul>
        </div>

        <!-- ERROR -->
        <div v-else-if="stage === 'error'" class="flex-1 p-5 space-y-4">
          <div class="border-2 border-ink bg-brand-500 px-4 py-3">
            <p class="font-display text-xl uppercase mb-1">Something went wrong</p>
            <p class="text-sm">{{ errorMsg }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 border-t-2 border-ink px-5 py-4 bg-cream flex flex-wrap gap-2 items-center justify-between">
          <button @click="emit('close')" class="brutalist-btn text-sm">{{ stage === 'done' ? 'Close' : 'Cancel' }}</button>
          <div class="flex gap-2">
            <button v-if="stage === 'setup' || stage === 'error'" @click="checkConnection" class="brutalist-btn text-sm">Retry</button>
            <button v-if="stage === 'review'" @click="stage = 'terms'" class="brutalist-btn text-sm">← Edit terms</button>
            <button v-if="stage === 'terms'" @click="findProducts" :disabled="!lines.length" class="brutalist-btn-red disabled:opacity-50">
              Find products →
            </button>
            <button v-if="stage === 'review'" @click="addToCart" :disabled="!active.length" class="brutalist-btn-red disabled:opacity-50">
              Add {{ active.length }} item{{ active.length !== 1 ? 's' : '' }} · CHF {{ total.toFixed(2) }} →
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
