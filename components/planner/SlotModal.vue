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
    class="fixed inset-0 z-50 scrim flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4"
    @click.self="emit('close')"
  >
    <div class="sheet w-full sm:max-w-xl flex flex-col max-h-[85vh] sm:max-h-[80vh]">

      <div class="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
        <div>
          <h2 class="title-section">
            {{ DAY_LABELS[day] }} {{ MEAL_LABELS[meal] }}
          </h2>
          <p class="mt-0.5 text-sm text-ink-2">Choose a recipe or mark as eating out</p>
        </div>
        <button @click="emit('close')" class="btn-icon" aria-label="Close"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <div class="px-5 pt-4 flex gap-2 shrink-0">
        <button @click="emit('select', 'eating_out')"
          class="flex-1 btn"
          :class="current === 'eating_out'
            ? 'bg-accent text-white'
            : ''">
          Eating out
        </button>
        <button @click="emit('select', null)"
          class="flex-1 btn"
          :class="current === null
            ? 'bg-accent text-white'
            : ''">
          Clear slot
        </button>
      </div>

      <div class="px-5 pt-3 shrink-0">
        <input v-model="search" type="search" placeholder="Search recipes..."
          class="input" />
      </div>

      <div class="overflow-y-auto flex-1 px-5 py-3 space-y-1">
        <div v-if="filtered.length === 0" class="py-8 text-center text-sm text-ink-2">
          No recipes found.
        </div>
        <button v-for="recipe in filtered" :key="recipe.id"
          class="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
          :class="current === recipe.id ? 'bg-accent/10' : 'hover:bg-ink/[0.05]'"
          @click="emit('select', recipe.id)">
          <img v-if="recipe.imageUrl" :src="recipe.imageUrl" :alt="recipe.name" class="h-11 w-11 shrink-0 rounded-lg object-cover" />
          <div class="flex-1 min-w-0">
            <p class="truncate text-[15px] font-medium">{{ recipe.name }}</p>
            <div class="flex gap-1.5 flex-wrap mt-0.5">
              <span v-for="tag in recipe.tags.slice(0, 3)" :key="tag"
                class="chip">{{ tag }}</span>
            </div>
          </div>
          <svg v-if="current === recipe.id"
            class="h-5 w-5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      <div class="sm:hidden shrink-0" style="padding-bottom: max(env(safe-area-inset-bottom), 1rem)" />
    </div>
  </div>
</template>

