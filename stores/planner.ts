import { defineStore } from 'pinia'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { WeeklyPlan, WeekSlots, SlotValue, DayKey, MealType } from '~/types'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns the ISO date string (YYYY-MM-DD) for the Monday of a given date */
export function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day) // Sunday = 0, so shift back 6 days
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function emptySlots(): WeekSlots {
  const days: DayKey[]   = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const meals: MealType[] = ['breakfast', 'lunch', 'dinner']
  const slots: any = {}
  for (const day of days) {
    slots[day] = {}
    for (const meal of meals) {
      slots[day][meal] = null
    }
  }
  return slots as WeekSlots
}

function planId(householdId: string, weekStart: string) {
  return `${householdId}_${weekStart}`
}

// ── store ────────────────────────────────────────────────────────────────────

export const usePlannerStore = defineStore('planner', () => {
  const { db }    = useFirebase()
  const authStore = useAuthStore()

  const currentWeekStart = ref<string>(getMondayOf(new Date()))
  const plan             = ref<WeeklyPlan | null>(null)
  const loading          = ref(false)

  let unsubscribe: Unsubscribe | null = null

  // ── subscribe ────────────────────────────────────────────────────────────

  function subscribe(householdId: string, weekStart: string) {
    unsubscribe?.()
    loading.value = true
    const id = planId(householdId, weekStart)
    const ref = doc(db, 'weeklyPlans', id)

    unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        plan.value = { id: snap.id, ...snap.data() } as WeeklyPlan
      } else {
        // No plan exists yet — show an empty one
        plan.value = {
          id,
          householdId,
          weekStartDate: weekStart,
          slots:         emptySlots(),
          updatedAt:     null as any,
          updatedBy:     '',
        }
      }
      loading.value = false
    })
  }

  function unsubscribeAll() {
    unsubscribe?.()
    unsubscribe = null
    plan.value  = null
  }

  // ── week navigation ───────────────────────────────────────────────────────

  function goToWeek(weekStart: string) {
    currentWeekStart.value = weekStart
    if (authStore.householdId) {
      subscribe(authStore.householdId, weekStart)
    }
  }

  function prevWeek() {
    const d = new Date(currentWeekStart.value + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    goToWeek(d.toISOString().split('T')[0])
  }

  function nextWeek() {
    const d = new Date(currentWeekStart.value + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    goToWeek(d.toISOString().split('T')[0])
  }

  // ── slot update ───────────────────────────────────────────────────────────

  async function setSlot(day: DayKey, meal: MealType, value: SlotValue) {
    const householdId = authStore.householdId
    if (!householdId) throw new Error('No household')

    const weekStart = currentWeekStart.value
    const id        = planId(householdId, weekStart)
    const ref       = doc(db, 'weeklyPlans', id)

    // Optimistic local update
    if (plan.value) {
      plan.value.slots[day][meal] = value
    }

    const snap = await getDoc(ref)

    if (snap.exists()) {
      // updateDoc interprets dot-notation keys as nested field paths,
      // so only the touched slot is overwritten.
      await updateDoc(ref, {
        [`slots.${day}.${meal}`]: value,
        updatedAt: serverTimestamp(),
        updatedBy: authStore.user!.uid,
      })
    } else {
      // First write for this week — create the full document.
      const slots = emptySlots()
      slots[day][meal] = value
      await setDoc(ref, {
        householdId,
        weekStartDate: weekStart,
        slots,
        updatedAt: serverTimestamp(),
        updatedBy: authStore.user!.uid,
      })
    }
  }

  return {
    currentWeekStart,
    plan,
    loading,
    subscribe,
    unsubscribeAll,
    goToWeek,
    prevWeek,
    nextWeek,
    setSlot,
  }
})
