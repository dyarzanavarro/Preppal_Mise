<script setup lang="ts">
import type { Recipe, SlotValue } from '~/types'

defineProps<{
  value:    SlotValue
  recipe:   Recipe | undefined
  compact?: boolean   // smaller cells for dense rows
  isToday?: boolean   // reserved: today's column highlight
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="group relative w-full rounded-xl text-left text-xs transition active:scale-[0.98]"
    :class="[
      compact ? 'min-h-[3rem]' : 'min-h-[4.5rem]',
      value === null && 'border border-dashed border-line text-ink-2/60 hover:border-accent/50 hover:bg-accent/5 hover:text-accent',
      value === 'eating_out' && 'bg-ink/[0.05] text-ink-2',
      value && value !== 'eating_out' && 'bg-accent/10 text-ink hover:bg-accent/15',
    ]"
    @click="emit('click')"
  >
    <!-- Empty -->
    <div v-if="value === null" class="flex h-full min-h-[inherit] items-center justify-center">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </div>

    <!-- Eating out -->
    <div v-else-if="value === 'eating_out'" class="flex h-full min-h-[inherit] items-center justify-center gap-1.5 p-2 font-medium">
      Eating out
    </div>

    <!-- Recipe -->
    <div v-else-if="recipe" class="flex h-full min-h-[inherit] items-center gap-2 p-2.5">
      <img v-if="recipe.imageUrl" :src="recipe.imageUrl" :alt="recipe.name" class="h-9 w-9 shrink-0 rounded-lg object-cover" />
      <span class="line-clamp-3 text-[13px] font-medium leading-snug">{{ recipe.name }}</span>
    </div>

    <!-- Recipe id set but recipe not loaded yet -->
    <div v-else class="flex h-full min-h-[inherit] items-center p-2.5 text-ink-2/60">…</div>
  </button>
</template>
