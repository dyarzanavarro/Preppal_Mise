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
  <div class="fixed inset-0 z-50 scrim flex items-center justify-center p-4"
    @click.self="emit('close')">
    <div class="sheet w-full max-w-xl p-6 space-y-4 !rounded-3xl">
      <div class="flex items-center justify-between">
        <h2 class="title-section">Import from URL</h2>
        <button @click="emit('close')" class="btn-icon" aria-label="Close"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <p class="text-sm text-ink-2">
        Paste the URL of a recipe page. We'll extract the ingredients and details automatically via JSON-LD schema.
      </p>

      <p v-if="error" class="rounded-xl bg-danger/10 text-danger px-3.5 py-2.5 text-sm">{{ error }}</p>

      <form class="space-y-3" @submit.prevent="handleImport">
        <input v-model="url" type="url" required placeholder="https://www.example.com/recipe/..."
          class="input" />
        <button type="submit" :disabled="loading"
          class="w-full btn-primary">
          {{ loading ? 'Importing...' : 'Import recipe' }}
        </button>
      </form>
    </div>
  </div>
</template>

