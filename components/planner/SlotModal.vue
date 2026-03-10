<script setup lang="ts">
import type { Recipe, SlotValue, DayKey, MealType } from '~/types'

const props = defineProps<{
  day: DayKey
  meal: MealType
  current: SlotValue
  recipes: Recipe[]
}>()

const emit = defineEmits<{
  select: [value: SlotValue]
  close: []
}>()

const search = ref('')

const filtered = computed(() => {
  if (!search.value.trim()) return props.recipes
  const q = search.value.toLowerCase()
  return props.recipes.filter((r) =>
    r.name.toLowerCase().includes(q) ||
    r.tags.some((t) => t.includes(q)),
  )
})

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner',
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4"
    @click.self="emit('close')"
  >
    <div class="w-full sm:max-w-2xl flex flex-col brutalist-card bg-[color:var(--paper)]
                max-h-[85vh] sm:max-h-[80vh]">

      <div class="flex items-center justify-between px-5 py-4 border-b-2 border-ink shrink-0">
        <div>
          <h2 class="font-display text-4xl">
            {{ DAY_LABELS[day] }} {{ MEAL_LABELS[meal] }}
          </h2>
          <p class="text-xs uppercase tracking-[0.08em] mt-0.5">Choose a recipe or mark as eating out</p>
        </div>
        <button @click="emit('close')" class="brutalist-btn text-xs px-2 py-1">Close</button>
      </div>

      <div class="px-5 pt-4 flex gap-2 shrink-0">
        <button @click="emit('select', 'eating_out')"
          class="flex-1 brutalist-btn text-sm"
          :class="current === 'eating_out'
            ? 'bg-brand-500 text-ink'
            : ''">
          Eating out
        </button>
        <button @click="emit('select', null)"
          class="flex-1 brutalist-btn text-sm"
          :class="current === null
            ? 'bg-brand-500 text-ink'
            : ''">
          Clear slot
        </button>
      </div>

      <div class="px-5 pt-3 shrink-0">
        <input v-model="search" type="search" placeholder="Search recipes..."
          class="brutalist-input" />
      </div>

      <div class="overflow-y-auto flex-1 px-5 py-3 space-y-1">
        <div v-if="filtered.length === 0" class="text-sm text-center py-8 uppercase tracking-[0.08em] opacity-60">
          No recipes found.
        </div>
        <button v-for="recipe in filtered" :key="recipe.id"
          class="w-full text-left flex items-center gap-3 px-3 py-3 border-2 border-ink bg-white transition-colors"
          :class="current === recipe.id
            ? 'bg-brand-500 text-ink'
            : 'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_#111111]'"
          @click="emit('select', recipe.id)">
          <div class="h-11 w-11 border-2 border-ink overflow-hidden shrink-0 bg-[color:var(--paper)] flex items-center justify-center text-lg">
            <img v-if="recipe.imageUrl" :src="recipe.imageUrl" :alt="recipe.name" class="h-full w-full object-cover" />
            <span v-else>R</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ recipe.name }}</p>
            <div class="flex gap-1.5 flex-wrap mt-0.5">
              <span v-for="tag in recipe.tags.slice(0, 3)" :key="tag"
                class="text-xs border border-ink px-1.5 py-0.5 bg-white text-ink">{{ tag }}</span>
            </div>
          </div>
          <svg v-if="current === recipe.id"
            class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      <div class="sm:hidden shrink-0" style="padding-bottom: max(env(safe-area-inset-bottom), 1rem)" />
    </div>
  </div>
</template>

