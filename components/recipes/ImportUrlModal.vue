<script setup lang="ts">
import type { ImportedRecipe } from '~/types'

const emit = defineEmits<{
  imported: [data: ImportedRecipe]
  close: []
}>()

const url     = ref('')
const error   = ref('')
const loading = ref(false)

async function handleImport() {
  if (!url.value.trim()) return
  error.value   = ''
  loading.value = true
  try {
    const data = await $fetch<ImportedRecipe>('/api/import-recipe', {
      method: 'POST',
      body:   { url: url.value.trim() },
    })
    emit('imported', data)
  } catch (e: any) {
    error.value = e.data?.message ?? 'Could not import recipe. The site may not support JSON-LD schema.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    @click.self="emit('close')">
    <div class="brutalist-card bg-[color:var(--paper)] w-full max-w-xl p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-display text-4xl">Import URL</h2>
        <button @click="emit('close')" class="brutalist-btn text-xs px-2 py-1">Close</button>
      </div>

      <p class="text-sm uppercase tracking-[0.08em]">
        Paste the URL of a recipe page. We'll extract the ingredients and details automatically via JSON-LD schema.
      </p>

      <p v-if="error" class="border-2 border-ink bg-brand-500 text-ink px-3 py-2 text-sm">{{ error }}</p>

      <form class="space-y-3" @submit.prevent="handleImport">
        <input v-model="url" type="url" required placeholder="https://www.example.com/recipe/..."
          class="brutalist-input" />
        <button type="submit" :disabled="loading"
          class="w-full brutalist-btn-red disabled:opacity-60">
          {{ loading ? 'Importing...' : 'Import Recipe' }}
        </button>
      </form>
    </div>
  </div>
</template>

