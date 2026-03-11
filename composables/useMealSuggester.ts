import { doc, getDoc } from 'firebase/firestore'
import type { DayKey, MealType, Recipe, WeekSlots } from '~/types'
import { getMondayOf } from '~/stores/planner'

// ── Public types ─────────────────────────────────────────────────────────────

export interface SuggestionPrefs {
  days:              number        // 1–7: how many days to fill (Mon → Mon+N)
  slots:             MealType[]    // which meal types to generate for
  dietaryFilter:     'any' | 'vegetarian' | 'vegan'
  avoidRecentWeeks:  number        // 0 | 1 | 2 | 4 weeks
  preferredTags:     string[]      // soft filter — falls back if too few matches
  fillEmptyOnly:     boolean       // skip slots that already have a value
}

export interface SuggestedSlot {
  day:    DayKey
  meal:   MealType
  recipe: Recipe | null   // null = not enough recipes in library
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useMealSuggester() {
  const { db }    = useFirebase()
  const authStore = useAuthStore()

  const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

  // ── Fetch recipe IDs used in the last N weeks ─────────────────────────────

  async function getRecentRecipeIds(
    householdId: string,
    weeksBack: number,
  ): Promise<Set<string>> {
    if (weeksBack === 0) return new Set()

    const usedIds = new Set<string>()
    const today   = new Date()

    const promises = Array.from({ length: weeksBack }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (i + 1) * 7)
      const weekStart = getMondayOf(d)
      return getDoc(doc(db, 'weeklyPlans', `${householdId}_${weekStart}`))
    })

    const snaps = await Promise.all(promises)

    for (const snap of snaps) {
      if (!snap.exists()) continue
      const slots = snap.data().slots as WeekSlots
      for (const day of Object.values(slots)) {
        for (const val of Object.values(day)) {
          if (val && val !== 'eating_out') usedIds.add(val)
        }
      }
    }

    return usedIds
  }

  // ── Build filtered candidate pool ─────────────────────────────────────────

  function buildCandidates(
    recipes:   Recipe[],
    prefs:     SuggestionPrefs,
    recentIds: Set<string>,
  ): Recipe[] {
    let pool = [...recipes]

    // Dietary
    if (prefs.dietaryFilter === 'vegan') {
      pool = pool.filter(r => r.tags.some(t => t.toLowerCase() === 'vegan'))
    } else if (prefs.dietaryFilter === 'vegetarian') {
      pool = pool.filter(r =>
        r.tags.some(t => ['vegan', 'vegetarian'].includes(t.toLowerCase())),
      )
    }

    // Avoid recently used
    if (prefs.avoidRecentWeeks > 0) {
      pool = pool.filter(r => !recentIds.has(r.id))
    }

    // Soft preferred-tag filter
    if (prefs.preferredTags.length > 0) {
      const tagFiltered = pool.filter(r =>
        prefs.preferredTags.some(pt =>
          r.tags.some(rt => rt.toLowerCase().includes(pt.toLowerCase())),
        ),
      )
      // Only apply if we'd still cover at least half the requested slots
      const slotsNeeded = prefs.days * prefs.slots.length
      if (tagFiltered.length >= Math.ceil(slotsNeeded * 0.5)) {
        pool = tagFiltered
      }
    }

    return pool
  }

  // ── Main generate fn ──────────────────────────────────────────────────────

  async function generate(
    recipes:      Recipe[],
    currentSlots: WeekSlots,
    prefs:        SuggestionPrefs,
  ): Promise<{ suggestions: SuggestedSlot[]; missingCount: number }> {
    const householdId = authStore.householdId
    if (!householdId) throw new Error('No household')

    const recentIds  = await getRecentRecipeIds(householdId, prefs.avoidRecentWeeks)
    const candidates = buildCandidates(recipes, prefs, recentIds)

    // Fisher-Yates shuffle so every run gives a fresh mix
    const pool = [...candidates]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    const targetDays    = DAYS.slice(0, prefs.days)
    const suggestions: SuggestedSlot[] = []
    let   poolIndex     = 0
    let   missingCount  = 0

    for (const day of targetDays) {
      for (const meal of prefs.slots) {
        // Respect fillEmptyOnly
        if (prefs.fillEmptyOnly && currentSlots[day][meal] !== null) continue

        if (poolIndex < pool.length) {
          suggestions.push({ day, meal, recipe: pool[poolIndex++] })
        } else {
          suggestions.push({ day, meal, recipe: null })
          missingCount++
        }
      }
    }

    return { suggestions, missingCount }
  }

  // ── Expose candidate builder for the swap picker ─────────────────────────

  function getCandidatesForSwap(
    recipes: Recipe[],
    prefs:   Pick<SuggestionPrefs, 'dietaryFilter'>,
  ): Recipe[] {
    let pool = [...recipes]
    if (prefs.dietaryFilter === 'vegan') {
      pool = pool.filter(r => r.tags.some(t => t.toLowerCase() === 'vegan'))
    } else if (prefs.dietaryFilter === 'vegetarian') {
      pool = pool.filter(r =>
        r.tags.some(t => ['vegan', 'vegetarian'].includes(t.toLowerCase())),
      )
    }
    return pool.sort((a, b) => a.name.localeCompare(b.name))
  }

  return { generate, getCandidatesForSwap }
}
