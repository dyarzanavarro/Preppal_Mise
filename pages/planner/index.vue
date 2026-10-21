<script setup lang="ts">
import type { DayKey, MealType, SlotValue } from '~/types'
import type { SuggestedSlot } from '~/composables/useMealSuggester'
import { getMondayOf } from '~/stores/planner'

definePageMeta({ middleware: 'auth' })

const plannerStore = usePlannerStore()
const recipesStore = useRecipesStore()

const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner']

const DAY_SHORT: Record<DayKey, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}
const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner',
}

const weekDates = computed(() => {
  const monday = new Date(plannerStore.currentWeekStart + 'T00:00:00')
  return DAYS.map((day, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return {
      day,
      label: DAY_SHORT[day],
      date: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
    }
  })
})

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(start)} - ${fmt(end)}`
}

const isCurrentWeek = computed(() => plannerStore.currentWeekStart === getMondayOf(new Date()))

const todayKey = computed<DayKey | null>(() => {
  if (!isCurrentWeek.value) return null
  const MAP: Record<number, DayKey> = {
    1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun',
  }
  return MAP[new Date().getDay()]
})

// ── Slot modal ────────────────────────────────────────────────────────────────

const activeSlot = ref<{ day: DayKey; meal: MealType } | null>(null)

function openSlot(day: DayKey, meal: MealType) {
  activeSlot.value = { day, meal }
}

function closeSlot() {
  activeSlot.value = null
}

async function handleSlotSelect(value: SlotValue) {
  if (!activeSlot.value) return
  await plannerStore.setSlot(activeSlot.value.day, activeSlot.value.meal, value)
  closeSlot()
}

function getSlot(day: DayKey, meal: MealType): SlotValue {
  return plannerStore.plan?.slots[day][meal] ?? null
}

function getRecipe(day: DayKey, meal: MealType) {
  const val = getSlot(day, meal)
  if (!val || val === 'eating_out') return undefined
  return recipesStore.getById(val)
}

// ── Meal suggester ────────────────────────────────────────────────────────────

const showSuggestModal = ref(false)

async function handleApplySuggestions(suggestions: SuggestedSlot[]) {
  await Promise.all(
    suggestions.map(s => plannerStore.setSlot(s.day, s.meal, s.recipe!.id)),
  )
  showSuggestModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="title-page">Planner</h1>
        <p class="mt-1 text-ink-2">{{ formatWeekLabel(plannerStore.currentWeekStart) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center rounded-full bg-ink/[0.06] p-0.5">
          <button @click="plannerStore.prevWeek()" class="grid h-8 w-8 place-items-center rounded-full text-ink-2 transition hover:bg-surface hover:text-ink" aria-label="Previous week">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            @click="plannerStore.goToWeek(getMondayOf(new Date()))"
            :disabled="isCurrentWeek"
            class="px-3 text-sm font-medium transition disabled:text-ink-2/60">
            Today
          </button>
          <button @click="plannerStore.nextWeek()" class="grid h-8 w-8 place-items-center rounded-full text-ink-2 transition hover:bg-surface hover:text-ink" aria-label="Next week">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <button @click="showSuggestModal = true" class="btn-primary">✦ Suggest week</button>
      </div>
    </section>

    <div v-if="plannerStore.loading" class="card p-10 text-center text-ink-2">Loading plan…</div>

    <template v-else>
      <!-- Mobile: card per day -->
      <section class="md:hidden space-y-3">
        <article v-for="item in weekDates" :key="item.day" class="card p-4 space-y-3">
          <div class="flex items-baseline justify-between">
            <p class="text-lg font-semibold tracking-tight">{{ item.label }} <span class="font-normal text-ink-2">{{ item.date }} {{ item.month }}</span></p>
            <span v-if="item.day === todayKey" class="chip chip-accent">Today</span>
          </div>
          <div class="space-y-2">
            <div v-for="meal in MEALS" :key="meal" class="grid grid-cols-[72px_1fr] items-center gap-2">
              <span class="text-xs font-medium text-ink-2">{{ MEAL_LABEL[meal] }}</span>
              <PlannerSlotCell
                :value="getSlot(item.day, meal)"
                :recipe="getRecipe(item.day, meal)"
                @click="openSlot(item.day, meal)"
              />
            </div>
          </div>
        </article>
      </section>

      <!-- Desktop: grid -->
      <section class="hidden md:block card p-5 overflow-x-auto">
        <div class="min-w-[860px] grid grid-cols-[84px_repeat(7,minmax(0,1fr))] gap-2">
          <div />
          <div v-for="item in weekDates" :key="item.day" class="pb-1 text-center">
            <p class="text-xs font-medium" :class="item.day === todayKey ? 'text-accent' : 'text-ink-2'">{{ item.label }}</p>
            <p class="mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full text-lg font-semibold"
               :class="item.day === todayKey ? 'bg-accent text-white' : ''">{{ item.date }}</p>
          </div>
          <template v-for="meal in MEALS" :key="meal">
            <div class="flex items-center text-xs font-medium text-ink-2">{{ MEAL_LABEL[meal] }}</div>
            <PlannerSlotCell
              v-for="{ day } in weekDates"
              :key="day"
              :is-today="day === todayKey"
              :value="getSlot(day, meal)"
              :recipe="getRecipe(day, meal)"
              @click="openSlot(day, meal)"
            />
          </template>
        </div>
      </section>
    </template>

    <!-- Bottom actions -->
    <div class="flex flex-wrap gap-2 pt-2 pb-8 sm:pb-0">
      <NuxtLink to="/shopping" class="btn">
        Generate Shopping List
      </NuxtLink>
    </div>
  </div>

  <!-- Slot modal -->
  <PlannerSlotModal
    v-if="activeSlot"
    :day="activeSlot.day"
    :meal="activeSlot.meal"
    :current="getSlot(activeSlot.day, activeSlot.meal)"
    :recipes="recipesStore.recipes"
    @select="handleSlotSelect"
    @close="closeSlot"
  />

  <!-- Suggest modal -->
  <PlannerSuggestModal
    v-if="showSuggestModal && plannerStore.plan"
    :current-slots="plannerStore.plan.slots"
    :recipes="recipesStore.recipes"
    :all-tags="recipesStore.allTags"
    @apply="handleApplySuggestions"
    @close="showSuggestModal = false"
  />
</template>
