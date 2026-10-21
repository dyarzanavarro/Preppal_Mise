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
      class="fixed inset-0 z-50 scrim flex items-end md:items-center justify-center p-0 md:p-4"
      @click.self="emit('close')">

      <!-- Panel -->
      <div
        class="sheet w-full md:max-w-2xl max-h-[92dvh] flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <p class="eyebrow mb-0.5">Planner</p>
            <h2 class="title-section">Suggest my week</h2>
          </div>
          <button @click="emit('close')" class="btn-icon" aria-label="Close"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <!-- ── STAGE: PREFS ────────────────────────────────────────────── -->
        <div v-if="stage === 'prefs'" class="flex-1 overflow-y-auto p-5 space-y-6">

          <!-- Days -->
          <div class="space-y-2">
            <p class="text-[15px] font-semibold">Days to fill</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="n in 7"
                :key="n"
                @click="prefs.days = n"
                class="h-10 w-10 rounded-full text-[15px] font-medium transition"
                :class="prefs.days === n
                  ? 'bg-accent text-white'
                  : 'bg-ink/[0.06] hover:bg-ink/10'">
                {{ n }}
              </button>
            </div>
            <p class="text-xs text-ink-2">Mon → {{ ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][prefs.days - 1] }}</p>
          </div>

          <!-- Meal slots -->
          <div class="space-y-2">
            <p class="text-[15px] font-semibold">Meal slots to fill</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="m in MEAL_OPTIONS"
                :key="m.value"
                @click="toggleMeal(m.value)"
                class="btn"
                :class="prefs.slots.includes(m.value)
                  ? 'bg-accent text-white'
                  : ''">
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- Fill empty only -->
          <div class="flex items-center gap-3">
            <button
              @click="prefs.fillEmptyOnly = !prefs.fillEmptyOnly"
              class="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors"
              :class="prefs.fillEmptyOnly ? 'bg-ok' : 'bg-ink/20'"
              role="switch" :aria-checked="prefs.fillEmptyOnly">
              <span
                class="absolute left-0.5 top-0.5 block h-[22px] w-[22px] rounded-full bg-white shadow transition-transform"
                :class="prefs.fillEmptyOnly ? 'translate-x-[18px]' : 'translate-x-0'" />
            </button>
            <span class="text-sm">Only fill empty slots (keep existing meals)</span>
          </div>

          <!-- Dietary filter -->
          <div class="space-y-2">
            <p class="text-[15px] font-semibold">Dietary preference</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in ['any', 'vegetarian', 'vegan']"
                :key="opt"
                @click="prefs.dietaryFilter = opt as any"
                class="btn"
                :class="prefs.dietaryFilter === opt
                  ? 'bg-accent text-white'
                  : ''">
                {{ opt === 'any' ? 'No restriction' : opt.charAt(0).toUpperCase() + opt.slice(1) }}
              </button>
            </div>
          </div>

          <!-- Avoid recent -->
          <div class="space-y-2">
            <p class="text-[15px] font-semibold">Avoid recipes used in last…</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="w in [0, 1, 2, 4]"
                :key="w"
                @click="prefs.avoidRecentWeeks = w"
                class="btn"
                :class="prefs.avoidRecentWeeks === w
                  ? 'bg-accent text-white'
                  : ''">
                {{ w === 0 ? 'No limit' : `${w} week${w > 1 ? 's' : ''}` }}
              </button>
            </div>
          </div>

          <!-- Preferred tags -->
          <div v-if="allTags.length > 0" class="space-y-2">
            <p class="text-[15px] font-semibold">Preferred tags <span class="text-sm font-normal text-ink-2">optional</span></p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in allTags"
                :key="tag"
                @click="toggleTag(tag)"
                class="rounded-full px-3 py-1 text-xs font-medium transition"
                :class="prefs.preferredTags.includes(tag)
                  ? 'bg-accent text-white'
                  : 'bg-ink/[0.06] text-ink-2 hover:bg-ink/10'">
                {{ tag }}
              </button>
            </div>
            <p v-if="prefs.preferredTags.length > 0" class="text-xs text-ink-2">
              Soft filter — falls back to full library if too few matches
            </p>
          </div>

          <p v-if="error" class="rounded-xl bg-warn/15 text-[#a05a00] px-3.5 py-2.5 text-sm">{{ error }}</p>

          <p v-if="recipes.length === 0" class="rounded-xl bg-ink/[0.05] px-3.5 py-2.5 text-sm text-ink-2">
            Your recipe library is empty. Add some recipes first.
          </p>
        </div>

        <!-- ── STAGE: PREVIEW ──────────────────────────────────────────── -->
        <div v-else class="flex-1 overflow-y-auto p-5 space-y-4">

          <!-- Summary bar -->
          <div class="flex flex-wrap items-center gap-3">
            <span class="chip">Preview</span>
            <span class="text-sm">{{ validCount }} meal{{ validCount !== 1 ? 's' : '' }} ready to apply</span>
            <button @click="stage = 'prefs'" class="btn btn-sm ml-auto">Back</button>
          </div>

          <!-- Missing warning -->
          <div v-if="missingCount > 0" class="rounded-xl bg-warn/15 text-[#a05a00] px-3.5 py-2.5 text-sm">
            {{ missingCount }} slot{{ missingCount !== 1 ? 's' : '' }} couldn't be filled — not enough recipes match your filters.
            <NuxtLink to="/recipes" class="underline ml-1" @click="emit('close')">Add more recipes</NuxtLink>
          </div>

          <!-- Slot list -->
          <div class="space-y-2">
            <div
              v-for="(s, idx) in suggestions"
              :key="`${s.day}-${s.meal}`"
              class="card overflow-hidden">

              <!-- Slot header -->
              <div class="flex items-center gap-2 px-4 py-2.5 border-b border-line bg-ink/[0.03]">
                <span class="text-sm font-semibold">{{ DAY_LABEL[s.day] }}</span>
                <span class="chip">{{ MEAL_LABEL[s.meal] }}</span>
                <div class="ml-auto flex gap-1">
                  <button @click="openSwap(idx)" class="btn btn-sm">Swap</button>
                  <button @click="removeSlot(idx)" class="btn-icon !h-7 !w-7" aria-label="Remove slot"><svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </div>

              <!-- Recipe or missing -->
              <div class="px-4 py-3">
                <template v-if="s.recipe">
                  <p class="font-medium leading-snug">{{ s.recipe.name }}</p>
                  <p v-if="s.recipe.tags.length" class="text-xs text-ink-2 mt-0.5">
                    {{ s.recipe.tags.join(' · ') }}
                  </p>
                </template>
                <p v-else class="text-sm text-ink-2/70 italic">No recipe available — tap Swap to pick one manually</p>
              </div>

              <!-- Swap picker (inline) -->
              <div v-if="swappingIdx === idx" class="border-t border-line">
                <div class="p-2 border-b border-line flex gap-2">
                  <input
                    v-model="swapSearch"
                    type="text"
                    placeholder="Search recipes…"
                    class="input text-sm flex-1"
                    autofocus />
                  <button @click="closeSwap" class="btn btn-sm">Cancel</button>
                </div>
                <div class="max-h-48 overflow-y-auto divide-y divide-line">
                  <button
                    v-for="r in filteredSwapCandidates"
                    :key="r.id"
                    @click="swapRecipe(r)"
                    class="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-ink/[0.05] transition-colors">
                    {{ r.name }}
                    <span v-if="r.tags.length" class="ml-1 text-xs font-normal text-ink-2">{{ r.tags.slice(0, 3).join(', ') }}</span>
                  </button>
                  <div v-if="filteredSwapCandidates.length === 0" class="px-3 py-2 text-xs text-ink-2/70">
                    No recipes found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="shrink-0 border-t border-line px-5 py-4 flex flex-wrap gap-2 items-center justify-between">
          <button @click="emit('close')" class="btn">Cancel</button>

          <div class="flex gap-2">
            <button
              v-if="stage === 'prefs'"
              @click="handleGenerate"
              :disabled="generating || recipes.length === 0"
              class="btn-primary">
              {{ generating ? 'Thinking…' : 'Generate suggestions' }}
            </button>
            <template v-else>
              <button
                @click="stage = 'prefs'"
                class="btn">
                Change preferences
              </button>
              <button
                @click="handleGenerate"
                :disabled="generating"
                class="btn">
                {{ generating ? '…' : 'Regenerate' }}
              </button>
              <button
                @click="handleApply"
                :disabled="applying || validCount === 0"
                class="btn-primary">
                {{ applying ? 'Applying…' : `Apply ${validCount} meal${validCount !== 1 ? 's' : ''}` }}
              </button>
            </template>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>
