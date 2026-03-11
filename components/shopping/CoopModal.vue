<script setup lang="ts">
import type { CartItemResult, CartItemStatus } from '~/server/api/coop/add-to-cart.post'
import type { ShoppingItem } from '~/types'

const props = defineProps<{
  items: ShoppingItem[]
}>()

const emit = defineEmits<{
  close: []
}>()

// ── State ─────────────────────────────────────────────────────────────────────

type Stage = 'confirm' | 'running' | 'done' | 'error'
const stage   = ref<Stage>('confirm')
const results = ref<CartItemResult[]>([])
const errorMsg = ref('')

const summary = computed(() => ({
  added:     results.value.filter(r => r.status === 'added').length,
  review:    results.value.filter(r => r.status === 'review').length,
  not_found: results.value.filter(r => r.status === 'not_found').length,
}))

// Only unchecked items go to Coop (what's still needed)
const itemsToSend = computed(() =>
  props.items
    .filter(i => !i.checked)
    .map(i => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit })),
)

// ── Send to Coop ──────────────────────────────────────────────────────────────

async function handleSend() {
  stage.value   = 'running'
  errorMsg.value = ''

  try {
    const data = await $fetch<{ results: CartItemResult[] }>('/api/coop/add-to-cart', {
      method: 'POST',
      body:   { items: itemsToSend.value },
    })
    results.value = data.results
    stage.value   = 'done'
  } catch (err: any) {
    errorMsg.value = err?.data?.message ?? err?.message ?? 'Something went wrong.'
    stage.value    = 'error'
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CartItemStatus, { label: string; classes: string; icon: string }> = {
  added:     { label: 'Added',        classes: 'bg-green-100 border-green-700 text-green-900', icon: '✅' },
  review:    { label: 'Needs review', classes: 'bg-brand-500 border-ink text-ink',             icon: '⚠️' },
  not_found: { label: 'Not found',    classes: 'bg-white border-ink text-ink/50',              icon: '❌' },
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 bg-ink/60 flex items-end md:items-center justify-center p-0 md:p-4"
      @click.self="emit('close')">

      <div class="w-full md:max-w-2xl max-h-[92dvh] flex flex-col border-2 border-ink bg-[color:var(--paper)] shadow-[8px_8px_0_#111111] overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b-2 border-ink bg-cream shrink-0">
          <div>
            <p class="editorial-kicker mb-1">Coop at Home</p>
            <h2 class="font-display text-3xl uppercase">Send to Cart</h2>
          </div>
          <button @click="emit('close')" class="brutalist-btn text-sm px-3 py-1.5">✕</button>
        </div>

        <!-- ── CONFIRM ─────────────────────────────────────────────────── -->
        <div v-if="stage === 'confirm'" class="flex-1 overflow-y-auto p-5 space-y-5">
          <p class="text-sm uppercase tracking-[0.06em] text-ink/70 leading-relaxed">
            This will open a headless browser, log into your Coop at Home account, and add each unchecked item to your cart. Make sure <code class="bg-cream border-2 border-ink px-1 text-xs">COOP_EMAIL</code> and <code class="bg-cream border-2 border-ink px-1 text-xs">COOP_PASSWORD</code> are set in your <code class="bg-cream border-2 border-ink px-1 text-xs">.env</code> file.
          </p>

          <div class="brutalist-card p-4 space-y-2">
            <p class="font-display text-2xl uppercase">{{ itemsToSend.length }} item{{ itemsToSend.length !== 1 ? 's' : '' }} to add</p>
            <p class="text-xs uppercase tracking-[0.06em] text-ink/50">Checked-off items are skipped (you already have them).</p>
          </div>

          <div class="max-h-48 overflow-y-auto border-2 border-ink divide-y-2 divide-ink">
            <div
              v-for="item in itemsToSend"
              :key="item.id"
              class="px-3 py-2 text-sm flex items-baseline gap-2 bg-white">
              <span class="font-medium">{{ item.name }}</span>
              <span v-if="item.quantity || item.unit" class="text-ink/50 text-xs">
                {{ [item.quantity, item.unit].filter(Boolean).join(' ') }}
              </span>
            </div>
            <div v-if="itemsToSend.length === 0" class="px-3 py-3 text-sm uppercase tracking-[0.06em] text-ink/40 bg-white">
              All items are already checked off.
            </div>
          </div>
        </div>

        <!-- ── RUNNING ─────────────────────────────────────────────────── -->
        <div v-else-if="stage === 'running'" class="flex-1 flex flex-col items-center justify-center p-10 space-y-6 text-center">
          <div class="font-display text-7xl animate-pulse">🛒</div>
          <h3 class="font-display text-4xl uppercase">Adding to cart…</h3>
          <p class="text-sm uppercase tracking-[0.06em] text-ink/60 max-w-xs">
            The browser is running in the background. This may take 1–2 minutes depending on your list size.
          </p>
        </div>

        <!-- ── DONE ────────────────────────────────────────────────────── -->
        <div v-else-if="stage === 'done'" class="flex-1 overflow-y-auto p-5 space-y-5">

          <!-- Summary chips -->
          <div class="flex flex-wrap gap-2">
            <span class="editorial-kicker bg-green-100 text-green-900">✅ {{ summary.added }} added</span>
            <span v-if="summary.review > 0" class="editorial-kicker bg-brand-500">⚠️ {{ summary.review }} needs review</span>
            <span v-if="summary.not_found > 0" class="editorial-kicker">❌ {{ summary.not_found }} not found</span>
          </div>

          <p class="text-sm uppercase tracking-[0.06em] text-ink/60">
            Head to <a href="https://www.coopathome.ch" target="_blank" class="underline hover:text-brand-500 transition-colors">coopathome.ch</a> to review and check out your cart.
          </p>

          <!-- Result list grouped by status -->
          <div
            v-for="statusKey in (['added', 'review', 'not_found'] as CartItemStatus[])"
            :key="statusKey">
            <template v-if="results.filter(r => r.status === statusKey).length > 0">
              <p class="editorial-kicker mb-2">{{ STATUS_CONFIG[statusKey].icon }} {{ STATUS_CONFIG[statusKey].label }}</p>
              <div class="border-2 border-ink divide-y-2 divide-ink">
                <div
                  v-for="r in results.filter(res => res.status === statusKey)"
                  :key="r.item.id"
                  class="px-3 py-2 text-sm"
                  :class="statusKey === 'added' ? 'bg-green-50' : statusKey === 'review' ? 'bg-brand-500/20' : 'bg-white'">
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="font-medium">{{ r.item.name }}</span>
                    <span v-if="r.item.quantity || r.item.unit" class="text-ink/50 text-xs shrink-0">
                      {{ [r.item.quantity, r.item.unit].filter(Boolean).join(' ') }}
                    </span>
                  </div>
                  <p v-if="r.productName" class="text-ink/60 text-xs mt-0.5">→ {{ r.productName }}</p>
                  <p v-if="r.message && statusKey !== 'added'" class="text-ink/50 text-xs mt-0.5 italic">{{ r.message }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- ── ERROR ───────────────────────────────────────────────────── -->
        <div v-else-if="stage === 'error'" class="flex-1 p-5 space-y-4">
          <div class="border-2 border-ink bg-brand-500 px-4 py-3">
            <p class="font-display text-xl uppercase mb-1">Something went wrong</p>
            <p class="text-sm">{{ errorMsg }}</p>
          </div>
          <p class="text-xs uppercase tracking-[0.06em] text-ink/60">
            Common fixes: Check that <code class="bg-cream border border-ink px-1">COOP_EMAIL</code> and <code class="bg-cream border border-ink px-1">COOP_PASSWORD</code> are set in <code class="bg-cream border border-ink px-1">.env</code>, and that you've run <code class="bg-cream border border-ink px-1">npx playwright install chromium</code>.
          </p>
        </div>

        <!-- Footer -->
        <div class="shrink-0 border-t-2 border-ink px-5 py-4 bg-cream flex flex-wrap gap-2 items-center justify-between">
          <button @click="emit('close')" class="brutalist-btn text-sm">
            {{ stage === 'done' ? 'Close' : 'Cancel' }}
          </button>

          <div class="flex gap-2">
            <button
              v-if="stage === 'error'"
              @click="stage = 'confirm'"
              class="brutalist-btn text-sm">
              ← Try again
            </button>
            <button
              v-if="stage === 'confirm'"
              @click="handleSend"
              :disabled="itemsToSend.length === 0"
              class="brutalist-btn-red disabled:opacity-50">
              Send {{ itemsToSend.length }} item{{ itemsToSend.length !== 1 ? 's' : '' }} to Coop →
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>
