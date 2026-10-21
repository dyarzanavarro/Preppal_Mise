<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits<{
  edit: [recipe: Recipe]
  delete: [id: string]
}>()

const hostname = computed(() => {
  if (!props.recipe.sourceUrl) return ''
  try { return new URL(props.recipe.sourceUrl).hostname.replace('www.', '') }
  catch { return props.recipe.sourceUrl }
})
</script>

<template>
  <article class="card flex flex-col overflow-hidden transition hover:shadow-md">
    <div v-if="recipe.imageUrl" class="h-44 overflow-hidden bg-ink/5">
      <img :src="recipe.imageUrl" :alt="recipe.name" class="h-full w-full object-cover" />
    </div>

    <div class="flex flex-1 flex-col gap-3 p-5">
      <div>
        <h3 class="text-lg font-semibold leading-snug tracking-tight">{{ recipe.name }}</h3>
        <p v-if="recipe.prepTime || recipe.cookTime || recipe.servings" class="mt-1 text-sm text-ink-2">
          {{ [recipe.prepTime && `${recipe.prepTime} prep`, recipe.cookTime && `${recipe.cookTime} cook`, recipe.servings && `serves ${recipe.servings}`].filter(Boolean).join(' · ') }}
        </p>
      </div>

      <div v-if="recipe.tags.length" class="flex flex-wrap gap-1.5">
        <span v-for="tag in recipe.tags" :key="tag" class="chip">{{ tag }}</span>
      </div>

      <div class="mt-auto flex items-center justify-between pt-1">
        <a v-if="recipe.sourceUrl" :href="recipe.sourceUrl" target="_blank" rel="noopener" class="link truncate text-xs">{{ hostname }}</a>
        <span v-else />
        <div class="flex gap-1.5">
          <button @click="emit('edit', recipe)" class="btn btn-sm">Edit</button>
          <button @click="emit('delete', recipe.id)" class="btn btn-sm text-danger">Delete</button>
        </div>
      </div>
    </div>
  </article>
</template>
