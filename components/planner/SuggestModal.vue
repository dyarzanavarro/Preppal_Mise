<script setup lang="ts">
import type { DayKey, MealType, Recipe, WeekSlots } from '~/types'
import type { SuggestedSlot, SuggestionPrefs } from '~/composables/useMealSuggester'

const props = defineProps<{
  currentSlots: WeekSlots
  recipes:      Recipe[]
  allTags:      string[]
}>()

const emit = defineEmits<{
  apply: [suggestions: SuggestedSlot[]]
  close: []
}>()

// ── Stage ────────────────────────────────────────────────────────────────────

type Stage = 'prefs' | 'preview'
const stage      = ref<Stage>('prefs')
const generating = ref(false)
const applying   = ref(false)
const error      = ref('')

// ── Preferences ───────────────────────────────────────────────────────────────

const prefs = reactive<SuggestionPrefs>({
  days:             7,
  slots:            ['dinner'],
  dietaryFilter:    'any',
  avoidRecentWeeks: 1,
  preferredTags:    [],
  fillEmptyOnly:    true,
})

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch',     label: 'Lunch' },
  { value: 'dinner',    label: 'Dinner' },
]

function toggleMeal(meal: MealType) {
  if (prefs.slots.includes(meal)) {
    if (prefs.slots.length > 1) prefs.slots = prefs.slots.filter(m => m !== meal)
  } else {
    prefs.slots = [...prefs.slots, meal]
  }
}

function toggleTag(tag: string) {
  prefs.preferredTags = prefs.preferredTags.includes(tag)
    ? prefs.preferredTags.filter(t => t !== tag)
    : [...prefs.preferredTags, tag]
}

// ── Suggestion state ──────────────────────────────────────────────────────────

const suggestions   = ref<SuggestedSlot[]>([])
const missingCount  = ref(0)
const { generate, getCandidatesForSwap } = useMealSuggester()

async function handleGenerate() {
  error.value = ''
  generating.value = true
  try {
    const result = await generate(props.recipes, props.currentSlots, { ...prefs })
    suggestions.value  = result.suggestions
    missingCount.value = result.missingCount
    stage.value = 'preview'
  } catch (e: any) {
    error.value = e.message ?? 'Something went wrong.'
  } finally {
    generating.value = false
  }
}

// ── Swap picker ───────────────────────────────────────────────────────────────

const swappingIdx   = ref<number | null>(null)
const swapSearch    = ref('')

const swapCandidates = computed(() =>
  getCandidatesForSwap(props.recipes, { dietaryFilter: prefs.dietaryFilter }),
)

const filteredSwapCandidates = computed(() => {
  const q = swapSearch.value.toLowerCase()
  return q
    ? swapCandidates.value.filter(r => r.name.toLowerCase().includes(q))
    : swapCandidates.value
})

function openSwap(idx: number) {
  swappingIdx.value = idx
  swapSearch.value  = ''
}

function closeSwap() {
  swappingIdx.value = null
}

function swapRecipe(recipe: Recipe | null) {
  if (swappingIdx.value === null) return
  suggestions.value[swappingIdx.value] = {
    ...suggestions.value[swappingIdx.value],
    recipe,
  }
  if (recipe) missingCount.value = Math.max(0, missingCount.value - 1)
  closeSwap()
}

function removeSlot(idx: number) {
  suggestions.value.splice(idx, 1)
}

// ── Apply ─────────────────────────────────────────────────────────────────────

async function handleApply() {
  applying.value = true
  emit('apply', suggestions.value.filter(s => s.recipe !== null))
}

// ── Display helpers ───────────────────────────────────────────────────────────

const DAY_LABEL: Record<DayKey, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner',
}

const validCount = computed(() =>
  suggestions.value.filter(s => s.recipe !== null).length,
)
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 bg-ink/60 flex items-end md:items-center justify-center p-0 md:p-4"
      @click.self="emit('close')">

      <!-- Panel -->
      <div
        class="w-full md:max-w-2xl max-h-[92dvh] flex flex-col border-2 border-ink bg-[color:var(--paper)] shadow-[8px_8px_0_#111111] overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b-2 border-ink bg-cream shrink-0">
          <div>
            <p class="editorial-kicker mb-1">AI Planner</p>
            <h2 class="font-display text-3xl uppercase">Suggest My Week</h2>
          </div>
          <button @click="emit('close')" class="brutalist-btn text-sm px-3 py-1.5">✕</button>
        </div>

        <!-- ── STAGE: PREFS ────────────────────────────────────────────── -->
        <div v-if="stage === 'prefs'" class="flex-1 overflow-y-auto p-5 space-y-6">

          <!-- Days -->
          <div class="space-y-2">
            <p class="font-display text-lg uppercase tracking-[0.05em]">Days to fill</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="n in 7"
                :key="n"
                @click="prefs.days = n"
                class="w-10 h-10 border-2 border-ink font-display text-lg transition-colors"
                :class="prefs.days === n
                  ? 'bg-brand-500 text-ink -translate-x-[1px] -translate-y-[1px] shadow-[3px_3px_0_#111111]'
                  : 'bg-[color:var(--paper)] hover:bg-cream'">
                {{ n }}
              </button>
            </div>
            <p class="text-xs uppercase tracking-[0.06em] text-ink/50">Mon → {{ ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][prefs.days - 1] }}</p>
          </div>

          <!-- Meal slots -->
          <div class="space-y-2">
            <p class="font-display text-lg uppercase tracking-[0.05em]">Meal slots to fill</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="m in MEAL_OPTIONS"
                :key="m.value"
                @click="toggleMeal(m.value)"
                class="brutalist-btn text-sm"
                :class="prefs.slots.includes(m.value)
                  ? 'bg-brand-500 text-ink -translate-x-[1px] -translate-y-[1px] shadow-[3px_3px_0_#111111]'
                  : ''">
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- Fill empty only -->
          <div class="flex items-center gap-3">
            <button
              @click="prefs.fillEmptyOnly = !prefs.fillEmptyOnly"
              class="w-12 h-7 border-2 border-ink transition-colors shrink-0 px-0.5"
              :class="prefs.fillEmptyOnly
                ? 'bg-brand-500 shadow-[2px_2px_0_#111111]'
                : 'bg-cream'">
              <span
                class="block h-4 w-4 border border-ink bg-[color:var(--paper)] transition-transform"
                :class="prefs.fillEmptyOnly ? 'translate-x-6' : 'translate-x-0'" />
            </button>
            <span class="text-sm uppercase tracking-[0.06em]">Only fill empty slots (keep existing meals)</span>
          </div>

          <!-- Dietary filter -->
          <div class="space-y-2">
            <p class="font-display text-lg uppercase tracking-[0.05em]">Dietary preference</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in ['any', 'vegetarian', 'vegan']"
                :key="opt"
                @click="prefs.dietaryFilter = opt as any"
                class="brutalist-btn text-sm capitalize"
                :class="prefs.dietaryFilter === opt
                  ? 'bg-brand-500 text-ink -translate-x-[1px] -translate-y-[1px] shadow-[3px_3px_0_#111111]'
                  : ''">
                {{ opt === 'any' ? 'No restriction' : opt.charAt(0).toUpperCase() + opt.slice(1) }}
              </button>
            </div>
          </div>

          <!-- Avoid recent -->
          <div class="space-y-2">
            <p class="font-display text-lg uppercase tracking-[0.05em]">Avoid recipes used in last…</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="w in [0, 1, 2, 4]"
                :key="w"
                @click="prefs.avoidRecentWeeks = w"
                class="brutalist-btn text-sm"
                :class="prefs.avoidRecentWeeks === w
                  ? 'bg-brand-500 text-ink -translate-x-[1px] -translate-y-[1px] shadow-[3px_3px_0_#111111]'
                  : ''">
                {{ w === 0 ? 'No limit' : `${w} week${w > 1 ? 's' : ''}` }}
              </button>
            </div>
          </div>

          <!-- Preferred tags -->
          <div v-if="allTags.length > 0" class="space-y-2">
            <p class="font-display text-lg uppercase tracking-[0.05em]">Preferred tags <span class="text-ink/40 text-sm normal-case">(optional)</span></p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in allTags"
                :key="tag"
                @click="toggleTag(tag)"
                class="border-2 border-ink px-2 py-1 text-xs font-display uppercase tracking-[0.06em] transition-colors"
                :class="prefs.preferredTags.includes(tag)
                  ? 'bg-brand-500 text-ink -translate-x-[1px] -translate-y-[1px] shadow-[3px_3px_0_#111111]'
                  : 'bg-[color:var(--paper)] hover:bg-cream'">
                {{ tag }}
              </button>
            </div>
            <p v-if="prefs.preferredTags.length > 0" class="text-xs uppercase tracking-[0.06em] text-ink/50">
              Soft filter — falls back to full library if too few matches
            </p>
          </div>

          <p v-if="error" class="border-2 border-ink bg-brand-500 px-3 py-2 text-sm">{{ error }}</p>

          <p v-if="recipes.length === 0" class="text-sm uppercase tracking-[0.06em] text-ink/60 border-2 border-ink px-3 py-2">
            Your recipe library is empty. Add some recipes first.
          </p>
        </div>

        <!-- ── STAGE: PREVIEW ──────────────────────────────────────────── -->
        <div v-else class="flex-1 overflow-y-auto p-5 space-y-4">

          <!-- Summary bar -->
          <div class="flex flex-wrap items-center gap-3">
            <span class="editorial-kicker">Preview</span>
            <span class="text-sm uppercase tracking-[0.06em]">{{ validCount }} meal{{ validCount !== 1 ? 's' : '' }} ready to apply</span>
            <button @click="stage = 'prefs'" class="brutalist-btn text-xs px-2 py-1 ml-auto">← Back</button>
          </div>

          <!-- Missing warning -->
          <div v-if="missingCount > 0" class="border-2 border-ink bg-brand-500 px-3 py-2 text-sm uppercase tracking-[0.06em]">
            ⚠ {{ missingCount }} slot{{ missingCount !== 1 ? 's' : '' }} couldn't be filled — not enough recipes match your filters.
            <NuxtLink to="/recipes" class="underline ml-1" @click="emit('close')">Add more recipes</NuxtLink>
          </div>

          <!-- Slot list -->
          <div class="space-y-2">
            <div
              v-for="(s, idx) in suggestions"
              :key="`${s.day}-${s.meal}`"
              class="border-2 border-ink bg-white">

              <!-- Slot header -->
              <div class="flex items-center gap-2 px-3 py-2 border-b-2 border-ink bg-cream">
                <span class="font-display text-sm uppercase">{{ DAY_LABEL[s.day] }}</span>
                <span class="editorial-kicker">{{ MEAL_LABEL[s.meal] }}</span>
                <div class="ml-auto flex gap-1">
                  <button @click="openSwap(idx)" class="brutalist-btn text-xs px-2 py-0.5">Swap</button>
                  <button @click="removeSlot(idx)" class="border-2 border-ink px-2 py-0.5 text-xs font-display uppercase hover:bg-brand-500 transition-colors">✕</button>
                </div>
              </div>

              <!-- Recipe or missing -->
              <div class="px-3 py-2">
                <template v-if="s.recipe">
                  <p class="font-display text-xl uppercase leading-tight">{{ s.recipe.name }}</p>
                  <p v-if="s.recipe.tags.length" class="text-xs uppercase tracking-[0.06em] text-ink/50 mt-0.5">
                    {{ s.recipe.tags.join(' · ') }}
                  </p>
                </template>
                <p v-else class="text-sm uppercase tracking-[0.06em] text-ink/40 italic">No recipe available — tap Swap to pick one manually</p>
              </div>

              <!-- Swap picker (inline) -->
              <div v-if="swappingIdx === idx" class="border-t-2 border-ink bg-cream">
                <div class="p-2 border-b-2 border-ink flex gap-2">
                  <input
                    v-model="swapSearch"
                    type="text"
                    placeholder="Search recipes…"
                    class="brutalist-input text-sm flex-1"
                    autofocus />
                  <button @click="closeSwap" class="brutalist-btn text-xs px-2">Cancel</button>
                </div>
                <div class="max-h-48 overflow-y-auto divide-y-2 divide-ink">
                  <button
                    v-for="r in filteredSwapCandidates"
                    :key="r.id"
                    @click="swapRecipe(r)"
                    class="w-full text-left px-3 py-2 font-display uppercase text-sm hover:bg-brand-500 transition-colors">
                    {{ r.name }}
                    <span v-if="r.tags.length" class="font-sans text-xs normal-case text-ink/50 ml-1">{{ r.tags.slice(0, 3).join(', ') }}</span>
                  </button>
                  <div v-if="filteredSwapCandidates.length === 0" class="px-3 py-2 text-xs uppercase tracking-[0.06em] text-ink/40">
                    No recipes found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="shrink-0 border-t-2 border-ink px-5 py-4 bg-cream flex flex-wrap gap-2 items-center justify-between">
          <button @click="emit('close')" class="brutalist-btn text-sm">Cancel</button>

          <div class="flex gap-2">
            <button
              v-if="stage === 'prefs'"
              @click="handleGenerate"
              :disabled="generating || recipes.length === 0"
              class="brutalist-btn-red disabled:opacity-50">
              {{ generating ? 'Thinking…' : 'Generate suggestions →' }}
            </button>
            <template v-else>
              <button
                @click="stage = 'prefs'"
                class="brutalist-btn text-sm">
                Change preferences
              </button>
              <button
                @click="handleGenerate"
                :disabled="generating"
                class="brutalist-btn text-sm"
                :class="generating ? 'opacity-50' : ''">
                {{ generating ? '…' : '↺ Regenerate' }}
              </button>
              <button
                @click="handleApply"
                :disabled="applying || validCount === 0"
                class="brutalist-btn-red disabled:opacity-50">
                {{ applying ? 'Applying…' : `Apply ${validCount} meal${validCount !== 1 ? 's' : ''}` }}
              </button>
            </template>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>
