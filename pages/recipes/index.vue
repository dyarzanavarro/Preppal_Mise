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
    <section class="grid-12 gap-y-4">
      <div class="col-span-12 lg:col-span-7">
        <p class="editorial-kicker mb-2">Editorial Archive</p>
        <h1 class="poster-title">Recipes</h1>
      </div>
      <div class="col-span-12 lg:col-span-5 flex flex-wrap lg:justify-end items-end gap-2">
        <button @click="openImport" class="brutalist-btn">Import URL</button>
        <button @click="openAdd" class="brutalist-btn-red">Add Recipe</button>
      </div>
    </section>

    <section class="grid-12">
      <div class="col-span-12 md:col-span-6">
        <input
          v-model="search"
          type="search"
          placeholder="Search recipes, tags, ingredients"
          class="brutalist-input" />
      </div>
      <div class="col-span-12 md:col-span-6 flex flex-wrap md:justify-end gap-2">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          class="brutalist-btn text-sm"
          :class="activeCategory === cat.key ? 'bg-brand-500 text-white' : ''"
          @click="activeCategory = activeCategory === cat.key ? null : cat.key">
          {{ cat.label }}
        </button>
      </div>
    </section>

    <section v-if="recipesStore.allTags.length" class="flex flex-wrap gap-2">
      <button
        class="brutalist-btn text-sm"
        :class="activeTag === null ? 'bg-brand-500 text-white' : ''"
        @click="activeTag = null">
        All
      </button>
      <button
        v-for="tag in recipesStore.allTags"
        :key="tag"
        class="brutalist-btn text-sm"
        :class="activeTag === tag ? 'bg-brand-500 text-white' : ''"
        @click="activeTag = activeTag === tag ? null : tag">
        {{ tag }}
      </button>
    </section>

    <div v-if="recipesStore.loading" class="brutalist-card p-8 text-center font-display text-2xl">Loading recipes</div>

    <div v-else-if="filtered.length === 0" class="brutalist-card p-10 text-center space-y-2">
      <p class="font-display text-5xl">No Match</p>
      <p class="text-sm uppercase tracking-[0.08em]">
        {{ recipesStore.recipes.length === 0 ? 'No recipes yet' : 'Try different filters' }}
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
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeModal(); importPrefill = null">

      <div class="w-full max-w-2xl brutalist-card bg-[color:var(--paper)] max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b-2 border-ink shrink-0">
          <h2 class="font-display text-3xl">{{ modalMode === 'edit' ? 'Edit Recipe' : 'Add Recipe' }}</h2>
          <button @click="closeModal(); importPrefill = null" class="brutalist-btn text-xs">Close</button>
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
