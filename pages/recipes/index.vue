<script setup lang="ts">
import type { Recipe, RecipeFormData, ImportedRecipe } from '~/types'

definePageMeta({ middleware: 'auth' })

const recipesStore = useRecipesStore()

const search = ref('')
const activeTag = ref<string | null>(null)
const activeCategory = ref<string | null>(null)

const CATEGORIES = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'quick', label: 'Quick' },
  { key: 'snack', label: 'Snack' },
]

const filtered = computed(() => {
  let list = recipesStore.recipes
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.tags.some((t) => t.includes(q)) ||
      r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
    )
  }
  if (activeCategory.value) {
    const cat = activeCategory.value
    list = list.filter((r) => r.tags.some((t) => t.toLowerCase().includes(cat)))
  }
  if (activeTag.value) {
    list = list.filter((r) => r.tags.includes(activeTag.value!))
  }
  return list
})

type ModalMode = 'add' | 'edit' | 'import' | null
const modalMode = ref<ModalMode>(null)
const editingRecipe = ref<Recipe | null>(null)
const saving = ref(false)

function openAdd() {
  editingRecipe.value = null
  modalMode.value = 'add'
}

function openEdit(recipe: Recipe) {
  editingRecipe.value = recipe
  modalMode.value = 'edit'
}

function openImport() {
  modalMode.value = 'import'
}

function closeModal() {
  modalMode.value = null
  editingRecipe.value = null
}

const importPrefill = ref<Partial<RecipeFormData> | null>(null)

function handleImported(data: ImportedRecipe) {
  importPrefill.value = {
    name: data.name,
    description: data.description,
    servings: data.servings,
    prepTime: data.prepTime,
    cookTime: data.cookTime,
    ingredients: data.ingredients,
    sourceUrl: data.sourceUrl,
    imageUrl: data.imageUrl,
    tags: [],
  }
  modalMode.value = 'add'
}

async function handleSave(data: RecipeFormData) {
  saving.value = true
  try {
    if (modalMode.value === 'edit' && editingRecipe.value) {
      await recipesStore.updateRecipe(editingRecipe.value.id, data)
    } else {
      await recipesStore.addRecipe(data)
    }
    closeModal()
    importPrefill.value = null
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this recipe?')) return
  await recipesStore.deleteRecipe(id)
}
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <h1 class="title-page">Recipes</h1>
      <div class="flex items-center gap-2">
        <button @click="openImport" class="btn">Import URL</button>
        <button @click="openAdd" class="btn-primary">Add recipe</button>
      </div>
    </section>

    <section class="space-y-3">
      <input
        v-model="search"
        type="search"
        placeholder="Search recipes, tags, ingredients"
        class="input" />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          class="btn btn-sm"
          :class="activeCategory === cat.key ? '!bg-accent !text-white' : ''"
          @click="activeCategory = activeCategory === cat.key ? null : cat.key">
          {{ cat.label }}
        </button>
      </div>
      <div v-if="recipesStore.allTags.length" class="flex flex-wrap gap-2">
        <button
          class="btn btn-sm"
          :class="activeTag === null ? '!bg-accent !text-white' : ''"
          @click="activeTag = null">
          All
        </button>
        <button
          v-for="tag in recipesStore.allTags"
          :key="tag"
          class="btn btn-sm"
          :class="activeTag === tag ? '!bg-accent !text-white' : ''"
          @click="activeTag = activeTag === tag ? null : tag">
          {{ tag }}
        </button>
      </div>
    </section>

    <div v-if="recipesStore.loading" class="card p-10 text-center text-ink-2">Loading recipes…</div>

    <div v-else-if="filtered.length === 0" class="card px-6 py-14 text-center space-y-1">
      <p class="title-section">No matches</p>
      <p class="text-ink-2">
        {{ recipesStore.recipes.length === 0 ? 'Add your first recipe to get started.' : 'Try different filters.' }}
      </p>
    </div>

    <section v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <RecipesRecipeCard
        v-for="recipe in filtered"
        :key="recipe.id"
        :recipe="recipe"
        @edit="openEdit"
        @delete="handleDelete"
      />
    </section>
  </div>

  <Teleport to="body">
    <RecipesImportUrlModal
      v-if="modalMode === 'import'"
      @imported="handleImported"
      @close="closeModal"
    />
  </Teleport>

  <Teleport to="body">
    <div
      v-if="modalMode === 'add' || modalMode === 'edit'"
      class="fixed inset-0 z-50 scrim flex items-end md:items-center justify-center md:p-4"
      @click.self="closeModal(); importPrefill = null">

      <div class="sheet w-full max-w-2xl max-h-[92dvh] flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h2 class="title-section">{{ modalMode === 'edit' ? 'Edit recipe' : 'Add recipe' }}</h2>
          <button @click="closeModal(); importPrefill = null" class="btn-icon" aria-label="Close"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div class="overflow-y-auto p-5">
          <RecipesRecipeForm
            :initial="modalMode === 'edit' ? editingRecipe ?? undefined : importPrefill ?? undefined"
            :loading="saving"
            @submit="handleSave"
            @cancel="closeModal(); importPrefill = null"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

