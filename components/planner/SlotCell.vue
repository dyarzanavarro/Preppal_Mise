<script setup lang="ts">
import type { Recipe, SlotValue } from '~/types'

const props = defineProps<{
  value:    SlotValue
  recipe:   Recipe | undefined
  compact?: boolean   // compact mode: smaller cells used in the week-overview rows
  isToday?: boolean   // highlights the cell with a today ring (desktop column)
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="w-full border-2 border-ink text-left transition-all text-xs group bg-[color:var(--paper)]"
    :class="[
      compact ? 'min-h-[3rem]' : 'min-h-[4.5rem]',
      isToday && 'shadow-[4px_4px_0_#111111]',
      {
        'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_#111111]': value === null,
        'bg-brand-100':  value === 'eating_out',
        'bg-brand-500 text-white':  value && value !== 'eating_out',
      },
    ]"
    @click="emit('click')"
  >
    <!-- Empty -->
    <div v-if="value === null"
      class="h-full min-h-[inherit] flex items-center justify-center opacity-50 transition-colors">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </div>

    <!-- Eating out -->
    <div v-else-if="value === 'eating_out'"
      :class="compact
        ? 'h-full min-h-[inherit] flex items-center justify-center text-base font-display'
        : 'p-2 flex items-center gap-1.5 font-display text-xl'">
      <span>EAT OUT</span>
    </div>

    <!-- Recipe -->
    <div v-else-if="recipe"
      :class="compact
        ? 'h-full min-h-[inherit] flex flex-col items-center justify-center gap-0.5 p-1.5'
        : 'p-2 flex items-center gap-2'">
      <div
        :class="compact
          ? 'h-6 w-6 border border-ink overflow-hidden bg-white text-ink shrink-0 flex items-center justify-center text-sm'
          : 'h-8 w-8 border border-ink overflow-hidden bg-white text-ink shrink-0 flex items-center justify-center text-base'">
        <img v-if="recipe.imageUrl" :src="recipe.imageUrl" :alt="recipe.name" class="h-full w-full object-cover" />
        <span v-else>R</span>
      </div>
      <span v-if="!compact" class="font-medium leading-tight line-clamp-2">{{ recipe.name }}</span>
      <span v-else class="text-[9px] leading-tight text-center line-clamp-2 w-full px-0.5">{{ recipe.name }}</span>
    </div>

    <!-- Recipe id set but recipe not loaded yet -->
    <div v-else
      :class="compact ? 'h-full min-h-[inherit] flex items-center justify-center opacity-50 text-[10px]' : 'p-2 opacity-60 italic'">
      {{ compact ? '...' : 'Recipe...' }}
    </div>
  </button>
</template>
