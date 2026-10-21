<script setup lang="ts">
definePageMeta({ layout: 'landing' })

// Static mock data for the planner preview in the hero
const mockPlan = [
  {
    label: 'Breakfast',
    cells: [
      { filled: true,  text: 'Porridge'  },
      { filled: false, text: '' },
      { filled: true,  text: 'Toast'     },
      { filled: true,  text: 'Eggs'      },
      { filled: false, text: '' },
      { filled: true,  text: 'Pancakes'  },
      { filled: false, text: '' },
    ],
  },
  {
    label: 'Lunch',
    cells: [
      { filled: false, text: '' },
      { filled: true,  text: 'Salad'     },
      { filled: false, out: true },
      { filled: true,  text: 'Soup'      },
      { filled: false, out: true },
      { filled: true,  text: 'Sandwich'  },
      { filled: false, out: true },
    ],
  },
  {
    label: 'Dinner',
    cells: [
      { filled: true,  text: 'Pasta'     },
      { filled: true,  text: 'Chicken'   },
      { filled: true,  text: 'Curry'     },
      { filled: false, out: true },
      { filled: true,  text: 'Pizza'     },
      { filled: true,  text: 'Steak'     },
      { filled: true,  text: 'Roast'     },
    ],
  },
]

const features = [
  { title: 'Your whole week at a glance', body: 'Lay out breakfast, lunch and dinner for every day. Tap a slot to assign a recipe or mark yourself as eating out. Everyone in the household sees changes instantly.' },
  { title: 'A cookbook you actually use', body: 'Save recipes with ingredients, times and tags. Import from a URL in seconds, or add your own. Filter by vegan, quick, high-protein and find exactly what you need.' },
  { title: 'One tap to a shopping list', body: 'Generate a categorised list straight from the week\'s plan. Quantities are merged across recipes, and everything stays in sync on every phone.' },
  { title: 'Everyone on the same page', body: 'Invite your partner, flatmates or family with a single code. One recipe book, one planner, one shopping list, with no syncing and no duplicates.' },
]

const steps = [
  { title: 'Create your account', body: 'Sign up with email or Google in under 30 seconds and give your household a name.' },
  { title: 'Add your go-to recipes', body: 'Paste a recipe URL to import it, or enter your own. Your library grows over time.' },
  { title: 'Plan the week and shop', body: 'Fill in the planner, generate the list, and invite your household with a code.' },
]
</script>
<template>
  <div>

    <!-- Hero -->
    <section class="mx-auto max-w-6xl px-4 md:px-8 pt-16 md:pt-24 text-center">
      <p class="text-sm font-medium text-accent">Household meal planning</p>
      <h1 class="title-hero mx-auto mt-4 max-w-3xl">Plan the week.<br class="hidden md:block" /> Shop in one tap.</h1>
      <p class="mx-auto mt-6 max-w-xl text-lg text-ink-2 md:text-xl">
        Build a recipe library, plan every meal, and get a shared shopping list, live with everyone you cook with.
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NuxtLink to="/auth/register" class="btn-primary !px-6 !py-3 !text-base">Get started free</NuxtLink>
        <NuxtLink to="/auth/login" class="btn !px-6 !py-3 !text-base">Sign in</NuxtLink>
      </div>

      <!-- Planner preview -->
      <div class="mx-auto mt-14 max-w-3xl overflow-hidden rounded-3xl border border-line bg-surface p-5 text-left shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] md:p-6">
        <div class="mb-4 flex items-center justify-between">
          <span class="font-semibold tracking-tight">This week</span>
          <span class="chip chip-accent">24 items on the list</span>
        </div>
        <div class="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-1.5 text-[10px] md:grid-cols-[72px_repeat(7,minmax(0,1fr))] md:gap-2 md:text-xs">
          <div />
          <div v-for="d in ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']" :key="d" class="pb-1 text-center font-medium text-ink-2">{{ d }}</div>
          <template v-for="row in mockPlan" :key="row.label">
            <div class="flex items-center text-ink-2">{{ row.label }}</div>
            <div
              v-for="(cell, ci) in row.cells"
              :key="ci"
              class="flex min-h-[2.5rem] items-center justify-center rounded-lg px-1 text-center font-medium md:min-h-[3rem]"
              :class="cell.filled ? 'bg-accent/10' : cell.out ? 'bg-ink/[0.05] text-ink-2' : 'border border-dashed border-line'">
              {{ cell.filled ? cell.text : cell.out ? 'Out' : '' }}
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="mx-auto max-w-6xl px-4 md:px-8 py-24 md:py-32">
      <h2 class="title-page text-center">Everything in one place.</h2>
      <div class="mt-12 grid gap-4 md:grid-cols-2">
        <article v-for="f in features" :key="f.title" class="card p-8 md:p-10 !rounded-3xl">
          <h3 class="text-2xl font-semibold tracking-tight">{{ f.title }}</h3>
          <p class="mt-3 text-ink-2">{{ f.body }}</p>
        </article>
      </div>
    </section>

    <!-- Steps -->
    <section class="border-y border-line bg-surface">
      <div class="mx-auto max-w-6xl px-4 md:px-8 py-24 md:py-28">
        <h2 class="title-page text-center">Up and running in three steps.</h2>
        <ol class="mt-12 grid gap-10 md:grid-cols-3">
          <li v-for="(step, i) in steps" :key="step.title" class="text-center">
            <span class="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent text-base font-semibold text-white">{{ i + 1 }}</span>
            <h3 class="mt-4 text-lg font-semibold tracking-tight">{{ step.title }}</h3>
            <p class="mx-auto mt-2 max-w-xs text-ink-2">{{ step.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Households -->
    <section class="mx-auto max-w-6xl px-4 md:px-8 py-24 md:py-32">
      <div class="grid items-center gap-12 md:grid-cols-2">
        <div>
          <h2 class="title-page">Cook together.<br />Shop together.</h2>
          <p class="mt-5 max-w-md text-lg text-ink-2">
            Share your household with a single invite code. The moment someone joins, they see the same planner, recipes and shopping list, and changes sync in real time.
          </p>
          <NuxtLink to="/auth/register" class="btn-primary mt-8 !px-6 !py-3 !text-base">Create a household</NuxtLink>
        </div>
        <div class="card mx-auto w-full max-w-sm space-y-4 p-6 !rounded-3xl">
          <p class="text-sm text-ink-2">Household</p>
          <p class="text-2xl font-semibold tracking-tight">The Smiths</p>
          <div class="flex items-center justify-between rounded-2xl bg-ink/[0.04] px-4 py-3">
            <span class="font-mono text-2xl font-semibold tracking-[0.18em]">MX7K4R</span>
            <span class="chip">Copy</span>
          </div>
          <p class="text-sm text-ink-2">3 members</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-4 pb-24 md:pb-32 text-center">
      <h2 class="title-hero mx-auto max-w-2xl">Start planning this week.</h2>
      <p class="mt-4 text-ink-2">Free for your household. No credit card.</p>
      <NuxtLink to="/auth/register" class="btn-primary mt-8 !px-6 !py-3 !text-base">Create free account</NuxtLink>
    </section>

  </div>
</template>
