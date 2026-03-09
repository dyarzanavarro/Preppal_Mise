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
  <article class="brutalist-card overflow-hidden flex flex-col">
    <div v-if="recipe.imageUrl" class="h-44 border-b-2 border-ink bg-black/5 overflow-hidden">
      <img :src="recipe.imageUrl" :alt="recipe.name" class="w-full h-full object-cover" />
    </div>
    <div v-else class="h-32 border-b-2 border-ink bg-brand-500 text-white grid place-items-center">
      <span class="font-display text-5xl">R</span>
    </div>

    <div class="p-4 flex-1 flex flex-col gap-3">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-display text-4xl leading-none">{{ recipe.name }}</h3>
        <div class="flex gap-1 shrink-0">
          <button @click="emit('edit', recipe)" class="brutalist-btn text-xs px-2 py-1">Edit</button>
          <button @click="emit('delete', recipe.id)" class="brutalist-btn-red text-xs px-2 py-1">Delete</button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.08em]">
        <span v-if="recipe.prepTime" class="border border-ink px-1.5 py-0.5">Prep {{ recipe.prepTime }}</span>
        <span v-if="recipe.cookTime" class="border border-ink px-1.5 py-0.5">Cook {{ recipe.cookTime }}</span>
        <span v-if="recipe.servings" class="border border-ink px-1.5 py-0.5">Serves {{ recipe.servings }}</span>
      </div>

      <div v-if="recipe.tags.length" class="flex flex-wrap gap-1.5 mt-auto">
        <span v-for="tag in recipe.tags" :key="tag" class="border border-ink bg-white px-2 py-0.5 text-[11px] uppercase tracking-[0.08em]">
          {{ tag }}
        </span>
      </div>

      <a v-if="recipe.sourceUrl" :href="recipe.sourceUrl" target="_blank" class="text-xs uppercase tracking-[0.08em] underline">
        {{ hostname }}
      </a>
    </div>
  </article>
</template>
