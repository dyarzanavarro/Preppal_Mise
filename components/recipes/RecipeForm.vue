<script setup lang="ts">
import type { RecipeFormData, Ingredient } from '~/types'

const props = defineProps<{
  initial?: Partial<RecipeFormData>
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: RecipeFormData]
  cancel: []
}>()

// ── form state ──────────────────────────────────────────────────────────────

const name        = ref(props.initial?.name        ?? '')
const description = ref(props.initial?.description ?? '')
const servings    = ref<number | undefined>(props.initial?.servings)
const prepTime    = ref(props.initial?.prepTime    ?? '')
const cookTime    = ref(props.initial?.cookTime    ?? '')
const sourceUrl   = ref(props.initial?.sourceUrl   ?? '')
const imageUrl    = ref(props.initial?.imageUrl    ?? '')
const notes       = ref(props.initial?.notes       ?? '')
const tagInput    = ref('')
const tags        = ref<string[]>([...(props.initial?.tags ?? [])])

const ingredients = ref<Ingredient[]>(
  props.initial?.ingredients?.length
    ? props.initial.ingredients.map((i) => ({ ...i }))
    : [{ name: '', quantity: '', unit: '' }],
)

// Re-initialise all fields when the parent swaps in a new `initial` (e.g.
// after a URL import completes and the modal switches from 'import' → 'add').
watch(
  () => props.initial,
  (val) => {
    if (!val) return
    name.value        = val.name        ?? ''
    description.value = val.description ?? ''
    servings.value    = val.servings
    prepTime.value    = val.prepTime    ?? ''
    cookTime.value    = val.cookTime    ?? ''
    sourceUrl.value   = val.sourceUrl   ?? ''
    imageUrl.value    = val.imageUrl    ?? ''
    notes.value       = val.notes       ?? ''
    tags.value        = [...(val.tags   ?? [])]
    ingredients.value = val.ingredients?.length
      ? val.ingredients.map((i) => ({ ...i }))
      : [{ name: '', quantity: '', unit: '' }]
  },
)

// ── ingredient helpers ───────────────────────────────────────────────────────

function addIngredient() {
  ingredients.value.push({ name: '', quantity: '', unit: '' })
}

function removeIngredient(index: number) {
  if (ingredients.value.length > 1) ingredients.value.splice(index, 1)
}

// ── tag helpers ──────────────────────────────────────────────────────────────

function addTag() {
  const t = tagInput.value.trim().toLowerCase()
  if (t && !tags.value.includes(t)) tags.value.push(t)
  tagInput.value = ''
}

function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag)
}

function handleTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }
}

// ── submit ───────────────────────────────────────────────────────────────────

function handleSubmit() {
  const data: RecipeFormData = {
    name:        name.value.trim(),
    description: description.value.trim() || undefined,
    servings:    servings.value,
    prepTime:    prepTime.value.trim() || undefined,
    cookTime:    cookTime.value.trim() || undefined,
    sourceUrl:   sourceUrl.value.trim() || undefined,
    imageUrl:    imageUrl.value.trim() || undefined,
    notes:       notes.value.trim() || undefined,
    tags:        tags.value,
    ingredients: ingredients.value.filter((i) => i.name.trim()),
  }
  emit('submit', data)
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">

    <!-- Name -->
    <div>
      <label class="label">Recipe name *</label>
      <input v-model="name" type="text" required placeholder="e.g. Spaghetti Bolognese"
        class="brutalist-input" />
    </div>

    <!-- Two-col meta -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Prep time</label>
        <input v-model="prepTime" type="text" placeholder="e.g. 15 mins" class="brutalist-input" />
      </div>
      <div>
        <label class="label">Cook time</label>
        <input v-model="cookTime" type="text" placeholder="e.g. 30 mins" class="brutalist-input" />
      </div>
      <div>
        <label class="label">Servings</label>
        <input v-model.number="servings" type="number" min="1" placeholder="4" class="brutalist-input" />
      </div>
      <div>
        <label class="label">Source URL</label>
        <input v-model="sourceUrl" type="url" placeholder="https://..." class="brutalist-input" />
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="label">Description</label>
      <textarea v-model="description" rows="2" placeholder="Optional short description..." class="brutalist-input resize-none" />
    </div>

    <!-- Ingredients -->
    <div>
      <label class="label">Ingredients</label>
      <!-- Column headers -->
      <div class="flex gap-1.5 mb-1 px-0.5">
        <span class="w-12 shrink-0 text-xs text-gray-400">Qty</span>
        <span class="w-[4.5rem] shrink-0 text-xs text-gray-400">Unit</span>
        <span class="flex-1 text-xs text-gray-400">Name</span>
      </div>
      <div class="space-y-1">
        <div v-for="(ing, i) in ingredients" :key="i" class="flex gap-1.5 items-center">
          <input v-model="ing.quantity" type="text" placeholder="—"
            class="ing-input w-12 shrink-0 text-center" />
          <input v-model="ing.unit" type="text" placeholder="—"
            class="ing-input w-[4.5rem] shrink-0" />
          <input v-model="ing.name" type="text" placeholder="Ingredient name"
            class="ing-input flex-1" />
          <button type="button" @click="removeIngredient(i)" class="brutalist-btn-red text-xs px-2 py-1 shrink-0">X</button>
        </div>
      </div>
      <button type="button" @click="addIngredient"
        class="mt-1.5 brutalist-btn text-xs px-2 py-1">
        Add ingredient
      </button>
    </div>

    <!-- Tags -->
    <div>
      <label class="label">Tags</label>
      <div class="flex flex-wrap gap-1.5 mb-2">
        <span v-for="tag in tags" :key="tag"
          class="inline-flex items-center gap-1 border border-ink bg-white text-xs font-medium px-2 py-1">
          {{ tag }}
          <button type="button" @click="removeTag(tag)" class="font-display">X</button>
        </span>
      </div>
      <input v-model="tagInput" type="text" placeholder="Add tag and press Enter..."
        @keydown="handleTagKeydown" @blur="addTag"
        class="brutalist-input" />
    </div>

    <!-- Notes -->
    <div>
      <label class="label">Notes</label>
      <textarea v-model="notes" rows="3" placeholder="Optional notes or instructions..." class="brutalist-input resize-none" />
    </div>

    <!-- Image URL -->
    <div>
      <label class="label">Image URL</label>
      <input v-model="imageUrl" type="url" placeholder="https://..." class="brutalist-input" />
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-2">
      <button type="button" @click="emit('cancel')"
        class="flex-1 brutalist-btn">
        Cancel
      </button>
      <button type="submit" :disabled="loading"
        class="flex-1 brutalist-btn-red disabled:opacity-60">
        {{ loading ? 'Saving...' : 'Save recipe' }}
      </button>
    </div>

  </form>
</template>

<style scoped>
.label { @apply block text-xs font-display uppercase tracking-[0.08em] mb-1; }
.ing-input { @apply border-2 border-ink bg-[color:var(--paper)] px-2 py-1 text-sm focus:outline-none; }
</style>
