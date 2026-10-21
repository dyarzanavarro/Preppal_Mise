<script setup lang="ts">
import type { IngredientCategory } from '~/types'

definePageMeta({ middleware: 'auth' })

const authStore     = useAuthStore()
const plannerStore  = usePlannerStore()
const recipesStore  = useRecipesStore()
const shoppingStore = useShoppingStore()

watch(
  () => [authStore.householdId, plannerStore.currentWeekStart] as const,
  ([id, weekStart]) => {
    if (id) shoppingStore.subscribe(id, weekStart)
  },
  { immediate: true },
)

onUnmounted(() => shoppingStore.unsubscribeAll())

const { generate: _compute, items: _computed } =
  useShoppingList(computed(() => plannerStore.plan), computed(() => recipesStore.recipes))

async function handleGenerate() {
  _compute()
  await shoppingStore.saveItems(_computed.value)
}

const copied = ref(false)

async function handleCopy() {
  await navigator.clipboard.writeText(shoppingStore.toClipboardText())
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// ── Coop modal ────────────────────────────────────────────────────────────────

const showCoopModal = ref(false)

// ── Formatting ────────────────────────────────────────────────────────────────

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end   = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(start)} - ${fmt(end)}`
}

const checkedCount = computed(() => shoppingStore.items.filter(i => i.checked).length)
const totalCount   = computed(() => shoppingStore.items.length)

// ── Manual add ────────────────────────────────────────────────────────────────

const draft = reactive<{
  name:     string
  quantity: string
  unit:     string
  category: IngredientCategory
}>({ name: '', quantity: '', unit: '', category: 'Other' })

const canAddManual = computed(() => draft.name.trim().length > 0)

async function handleAddManual() {
  if (!canAddManual.value) return
  await shoppingStore.addItem({
    name:     draft.name,
    quantity: draft.quantity,
    unit:     draft.unit,
    category: draft.category,
  })
  draft.name = ''
  draft.quantity = ''
  draft.unit = ''
  draft.category = 'Other'
}
</script>

<template>
  <div class="space-y-8">

    <!-- Header -->
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="title-page">Shopping</h1>
        <p class="mt-1 text-ink-2">{{ formatWeekLabel(plannerStore.currentWeekStart) }}</p>
      </div>
      <div v-if="totalCount > 0" class="flex flex-wrap items-center gap-2">
        <button @click="shoppingStore.uncheckAll()" class="btn">Uncheck all</button>
        <button @click="handleCopy" class="btn">{{ copied ? 'Copied' : 'Copy list' }}</button>
        <button @click="showCoopModal = true" class="btn-primary">Send to Coop</button>
      </div>
    </section>

    <div v-if="shoppingStore.loading" class="card p-10 text-center text-ink-2">Loading list…</div>

    <template v-else>

      <!-- Empty state: generate -->
      <section v-if="totalCount === 0" class="card px-6 py-14 text-center space-y-4">
        <h2 class="title-section">No list yet</h2>
        <p class="text-ink-2">Build it from this week's planned meals.</p>
        <button @click="handleGenerate" class="btn-primary">Generate list</button>
      </section>

      <template v-else>

        <!-- Progress -->
        <section class="flex items-center gap-3">
          <div class="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-ink/10">
            <div
              class="h-full rounded-full bg-accent transition-all duration-300"
              :style="{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }" />
          </div>
          <span class="text-sm text-ink-2">{{ checkedCount }} of {{ totalCount }}</span>
        </section>

        <!-- Manual add -->
        <form class="card p-3 grid grid-cols-2 md:grid-cols-[1fr_96px_96px_150px_auto] gap-2" @submit.prevent="handleAddManual">
          <input v-model="draft.name"     type="text" placeholder="Add an item" class="input col-span-2 md:col-span-1" />
          <input v-model="draft.quantity" type="text" placeholder="Qty"         class="input" />
          <input v-model="draft.unit"     type="text" placeholder="Unit"        class="input" />
          <select v-model="draft.category" class="input col-span-2 md:col-span-1">
            <option v-for="cat in shoppingStore.categoryOrder" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <button type="submit" :disabled="!canAddManual" class="btn-primary col-span-2 md:col-span-1">Add</button>
        </form>

        <!-- Items by category -->
        <section class="space-y-6">
          <div v-for="cat in shoppingStore.categoriesWithItems" :key="cat">
            <h2 class="mb-2 px-1 text-sm font-semibold text-ink-2">{{ cat }}</h2>
            <div class="list-group">
              <label
                v-for="item in shoppingStore.grouped[cat]"
                :key="item.id"
                class="group flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-ink/[0.03]">
                <input
                  type="checkbox"
                  :checked="item.checked"
                  @change="shoppingStore.toggleItem(item.id)"
                  class="check shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="truncate" :class="item.checked ? 'text-ink-2 line-through' : ''">
                    {{ item.name }}
                    <span v-if="item.quantity || item.unit" class="ml-1 text-sm text-ink-2">
                      {{ [item.quantity, item.unit].filter(Boolean).join(' ') }}
                    </span>
                  </p>
                  <p v-if="item.recipeNames.length" class="truncate text-xs text-ink-2/80">{{ item.recipeNames.join(', ') }}</p>
                </div>
                <button
                  type="button"
                  class="btn-icon opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
                  :aria-label="`Remove ${item.name}`"
                  @click.prevent.stop="shoppingStore.deleteItem(item.id)">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </label>
            </div>
          </div>
        </section>

        <div class="pb-8 sm:pb-0">
          <button @click="handleGenerate" class="btn">Regenerate from planner</button>
        </div>

      </template>
    </template>
  </div>

  <!-- Coop modal -->
  <ShoppingCoopModal
    v-if="showCoopModal"
    :items="shoppingStore.items"
    @close="showCoopModal = false"
  />
</template>
