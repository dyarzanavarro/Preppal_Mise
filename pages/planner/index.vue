<script setup lang="ts">
import type { DayKey, MealType, SlotValue } from '~/types'
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
</script>

<template>
  <div class="space-y-6">
    <section class="grid-12 gap-y-4">
      <div class="col-span-12 md:col-span-8">
        <p class="editorial-kicker mb-2">Weekly Composition</p>
        <h1 class="poster-title">Planner</h1>
        <p class="mt-2 font-medium">{{ formatWeekLabel(plannerStore.currentWeekStart) }}</p>
      </div>
      <div class="col-span-12 md:col-span-4 flex md:justify-end items-end gap-2">
        <button @click="plannerStore.prevWeek()" class="brutalist-btn">Prev</button>
        <button
          v-if="!isCurrentWeek"
          @click="plannerStore.goToWeek(getMondayOf(new Date()))"
          class="brutalist-btn-red">
          Today
        </button>
        <span v-else class="editorial-kicker">Current</span>
        <button @click="plannerStore.nextWeek()" class="brutalist-btn">Next</button>
      </div>
    </section>

    <div v-if="plannerStore.loading" class="brutalist-card p-8 text-center font-display text-2xl">Loading plan</div>

    <template v-else>
      <section class="md:hidden space-y-3">
        <article v-for="item in weekDates" :key="item.day" class="brutalist-card p-3 space-y-2">
          <div class="flex items-end justify-between">
            <p class="font-display text-3xl">{{ item.label }} {{ item.date }}</p>
            <span v-if="item.day === todayKey" class="editorial-kicker bg-brand-500 text-ink">Today</span>
          </div>
          <div class="space-y-2">
            <div v-for="meal in MEALS" :key="meal" class="grid grid-cols-[88px_1fr] items-center gap-2">
              <span class="text-xs uppercase tracking-[0.08em]">{{ MEAL_LABEL[meal] }}</span>
              <PlannerSlotCell
                :value="getSlot(item.day, meal)"
                :recipe="getRecipe(item.day, meal)"
                @click="openSlot(item.day, meal)"
              />
            </div>
          </div>
        </article>
      </section>

      <section class="hidden md:block brutalist-card p-4 overflow-x-auto">
        <div class="min-w-[860px] space-y-2">
          <div class="grid grid-cols-8 gap-2">
            <div class="border-2 border-ink bg-brand-500 text-ink px-2 py-2 font-display text-lg">Meal</div>
            <div
              v-for="item in weekDates"
              :key="item.day"
              class="border-2 border-ink px-2 py-2 text-center"
              :class="item.day === todayKey ? 'bg-brand-500 text-ink' : 'bg-[color:var(--paper)]'">
              <p class="font-display text-2xl">{{ item.label }}</p>
              <p class="text-xs uppercase tracking-[0.08em]">{{ item.date }} {{ item.month }}</p>
            </div>
          </div>
          <div v-for="meal in MEALS" :key="meal" class="grid grid-cols-8 gap-2">
            <div class="border-2 border-ink px-2 py-2 bg-[color:var(--paper)]">
              <p class="font-display text-2xl">{{ MEAL_LABEL[meal] }}</p>
            </div>
            <PlannerSlotCell
              v-for="{ day } in weekDates"
              :key="day"
              :is-today="day === todayKey"
              :value="getSlot(day, meal)"
              :recipe="getRecipe(day, meal)"
              @click="openSlot(day, meal)"
            />
          </div>
        </div>
      </section>
    </template>

    <NuxtLink to="/shopping" class="brutalist-btn-red inline-flex items-center justify-center">Generate Shopping List</NuxtLink>
  </div>

  <PlannerSlotModal
    v-if="activeSlot"
    :day="activeSlot.day"
    :meal="activeSlot.meal"
    :current="getSlot(activeSlot.day, activeSlot.meal)"
    :recipes="recipesStore.recipes"
    @select="handleSlotSelect"
    @close="closeSlot"
  />
</template>

