<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const plannerStore = usePlannerStore()
const recipesStore = useRecipesStore()
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

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(start)} - ${fmt(end)}`
}

const checkedCount = computed(() => shoppingStore.items.filter((i) => i.checked).length)
const totalCount = computed(() => shoppingStore.items.length)
</script>

<template>
  <div class="space-y-6">
    <section class="grid-12 gap-y-4">
      <div class="col-span-12 lg:col-span-8">
        <p class="editorial-kicker mb-2">Field Notes</p>
        <h1 class="poster-title">Shopping</h1>
        <p class="mt-2 font-medium">{{ formatWeekLabel(plannerStore.currentWeekStart) }}</p>
      </div>
      <div class="col-span-12 lg:col-span-4 flex lg:justify-end items-end">
        <NuxtLink to="/planner" class="brutalist-btn">Back to Planner</NuxtLink>
      </div>
    </section>

    <div v-if="shoppingStore.loading" class="brutalist-card p-8 text-center font-display text-2xl">Loading list</div>

    <template v-else>
      <section v-if="totalCount === 0" class="brutalist-card p-8 text-center space-y-4">
        <h2 class="font-display text-5xl">Generate</h2>
        <p class="uppercase tracking-[0.08em] text-sm">Build the list from this week's planned meals</p>
        <div>
          <button @click="handleGenerate" class="brutalist-btn-red">Generate List</button>
        </div>
      </section>

      <template v-else>
        <section class="brutalist-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-40 h-4 border-2 border-ink bg-white">
              <div
                class="h-full bg-brand-500"
                :style="{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }" />
            </div>
            <span class="font-display text-2xl">{{ checkedCount }}/{{ totalCount }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button @click="shoppingStore.uncheckAll()" class="brutalist-btn text-sm">Uncheck All</button>
            <button @click="handleCopy" class="brutalist-btn-red text-sm">{{ copied ? 'Copied' : 'Copy List' }}</button>
          </div>
        </section>

        <section class="space-y-4">
          <div v-for="cat in shoppingStore.categoriesWithItems" :key="cat" class="brutalist-card p-3">
            <h2 class="font-display text-3xl mb-2">{{ cat }}</h2>
            <div class="space-y-2">
              <label
                v-for="item in shoppingStore.grouped[cat]"
                :key="item.id"
                class="grid grid-cols-[24px_1fr] items-start gap-2 border-2 border-ink bg-white px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="item.checked"
                  @change="shoppingStore.toggleItem(item.id)"
                  class="mt-1 h-4 w-4 border-2 border-ink accent-black" />
                <div>
                  <p class="font-medium" :class="item.checked ? 'line-through opacity-50' : ''">
                    {{ item.name }}
                    <span v-if="item.quantity || item.unit" class="text-sm opacity-70">{{ [item.quantity, item.unit].filter(Boolean).join(' ') }}</span>
                  </p>
                  <p class="text-xs uppercase tracking-[0.08em] opacity-60">{{ item.recipeNames.join(', ') }}</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        <div>
          <button @click="handleGenerate" class="brutalist-btn">Regenerate</button>
        </div>
      </template>
    </template>
  </div>
</template>
