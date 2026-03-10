<script setup lang="ts">
definePageMeta({ layout: 'landing' })

// Static mock data for the planner preview in the hero
const mockPlan = [
  {
    label: 'B',
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
    label: 'L',
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
    label: 'D',
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
</script>

<template>
  <div>

    <!-- ─── HERO ─────────────────────────────────────────────────────────── -->
    <section class="border-b-2 border-ink overflow-hidden">
      <div class="mx-auto max-w-7xl px-4 md:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 items-center min-h-[88vh]">

          <!-- Left: copy -->
          <div class="py-12 md:py-0 space-y-6 md:space-y-8">
            <p class="editorial-kicker">Free · Household meal planning</p>
            <h1 class="font-display uppercase leading-[0.85] text-[18vw] md:text-[8vw] tracking-[-0.02em]">
              Plan.<br>Cook.<br>Eat.
            </h1>
            <p class="text-base md:text-xl leading-relaxed max-w-sm font-sans">
              The meal planner that actually sticks. Build your recipe library, plan the week in minutes, and auto-generate a categorised shopping list — shared live with your whole household.
            </p>
            <div class="flex flex-wrap gap-3 pt-2">
              <NuxtLink to="/auth/register" class="brutalist-btn-red text-lg px-6 py-3">
                Start for free →
              </NuxtLink>
              <NuxtLink to="/auth/login" class="brutalist-btn text-lg px-6 py-3">
                Sign in
              </NuxtLink>
            </div>
            <p class="text-xs uppercase tracking-[0.08em] text-ink/40">No credit card. No nonsense.</p>
          </div>

          <!-- Right: decorative planner mockup -->
          <div class="hidden md:flex items-center justify-center py-12">
            <div class="w-full max-w-lg border-2 border-ink shadow-[10px_10px_0_#111111] bg-[color:var(--paper)] overflow-hidden">
              <!-- Mockup header -->
              <div class="border-b-2 border-ink px-4 py-3 flex items-center justify-between bg-cream">
                <span class="font-display text-xl uppercase">Week Planner</span>
                <span class="editorial-kicker">This week</span>
              </div>
              <!-- Day labels -->
              <div class="grid grid-cols-8 border-b-2 border-ink text-[10px] font-display uppercase tracking-[0.08em]">
                <div class="p-2 border-r-2 border-ink text-ink/30"></div>
                <div
                  v-for="d in ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']"
                  :key="d"
                  class="p-2 text-center border-r-2 last:border-r-0 border-ink">
                  {{ d }}
                </div>
              </div>
              <!-- Meal rows -->
              <div
                v-for="(row, ri) in mockPlan"
                :key="ri"
                class="grid grid-cols-8 border-b-2 last:border-b-0 border-ink">
                <div class="p-2 border-r-2 border-ink font-display uppercase text-center text-ink/50 text-[9px]">{{ row.label }}</div>
                <div
                  v-for="(cell, ci) in row.cells"
                  :key="ci"
                  class="p-1.5 border-r-2 last:border-r-0 border-ink min-h-[36px] flex items-center"
                  :class="cell.filled ? 'bg-brand-500' : cell.out ? 'bg-cream' : ''">
                  <span v-if="cell.text" class="font-sans text-[9px] leading-tight font-medium truncate">{{ cell.text }}</span>
                  <span v-else-if="cell.out" class="font-display text-[8px] uppercase tracking-[0.06em] text-ink/40">Out</span>
                </div>
              </div>
              <!-- Shopping list preview strip -->
              <div class="border-t-2 border-ink px-4 py-3 bg-brand-500 flex items-center justify-between">
                <span class="font-display text-sm uppercase">Shopping list ready</span>
                <span class="border-2 border-ink bg-cream px-2 py-0.5 text-[10px] font-display uppercase">24 items</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ─── PROBLEM STRIP ─────────────────────────────────────────────────── -->
    <section class="border-b-2 border-ink bg-brand-500 py-6 overflow-hidden">
      <div class="mx-auto max-w-7xl px-4 md:px-8">
        <div class="flex flex-wrap items-center gap-4 md:gap-8">
          <p class="font-display text-2xl md:text-4xl uppercase leading-tight shrink-0">"What's for dinner?"</p>
          <p class="text-sm md:text-base uppercase tracking-[0.05em] text-ink/70 max-w-lg">
            Never again. Mise gives your household a shared plan, a shared recipe book, and a shared shopping list — everyone always in sync.
          </p>
          <NuxtLink to="/auth/register" class="brutalist-btn ml-auto shrink-0 hidden lg:inline-flex">
            Get started free →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ─── FEATURES ──────────────────────────────────────────────────────── -->
    <section class="border-b-2 border-ink py-16 md:py-24">
      <div class="mx-auto max-w-7xl px-4 md:px-8 space-y-12">

        <div class="space-y-2">
          <p class="editorial-kicker">Everything you need</p>
          <h2 class="font-display text-5xl md:text-7xl uppercase leading-none">Four tools.<br>One system.</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 border-2 border-ink">

          <!-- 01 Planner -->
          <div class="border-b-2 md:border-r-2 border-ink p-8 space-y-4 group hover:bg-brand-500 transition-colors duration-150">
            <p class="font-display text-7xl leading-none text-ink/10 group-hover:text-ink/30 transition-colors">01</p>
            <p class="editorial-kicker">Weekly Planner</p>
            <h3 class="font-display text-3xl md:text-4xl uppercase leading-tight">See your whole week at a glance</h3>
            <p class="text-sm md:text-base leading-relaxed text-ink/70">
              Lay out breakfast, lunch and dinner for every day of the week. Tap a slot to assign a recipe or mark yourself as eating out. Your plan updates for everyone in your household instantly.
            </p>
          </div>

          <!-- 02 Recipes -->
          <div class="border-b-2 border-ink p-8 space-y-4 group hover:bg-brand-500 transition-colors duration-150">
            <p class="font-display text-7xl leading-none text-ink/10 group-hover:text-ink/30 transition-colors">02</p>
            <p class="editorial-kicker">Recipe Library</p>
            <h3 class="font-display text-3xl md:text-4xl uppercase leading-tight">Build your household's cookbook</h3>
            <p class="text-sm md:text-base leading-relaxed text-ink/70">
              Save recipes with ingredients, prep time, tags and notes. Import from a URL in seconds or add manually. Filter by category — breakfast, vegan, quick — and find exactly what you need.
            </p>
          </div>

          <!-- 03 Shopping -->
          <div class="border-b-2 md:border-b-0 md:border-r-2 border-ink p-8 space-y-4 group hover:bg-brand-500 transition-colors duration-150">
            <p class="font-display text-7xl leading-none text-ink/10 group-hover:text-ink/30 transition-colors">03</p>
            <p class="editorial-kicker">Smart Shopping</p>
            <h3 class="font-display text-3xl md:text-4xl uppercase leading-tight">One tap. A full week's shop.</h3>
            <p class="text-sm md:text-base leading-relaxed text-ink/70">
              Generate a categorised shopping list straight from your weekly plan. Quantities are merged across recipes. Check items off as you walk the aisles. Stays in sync on every phone in the household.
            </p>
          </div>

          <!-- 04 Household -->
          <div class="p-8 space-y-4 group hover:bg-brand-500 transition-colors duration-150">
            <p class="font-display text-7xl leading-none text-ink/10 group-hover:text-ink/30 transition-colors">04</p>
            <p class="editorial-kicker">Shared Household</p>
            <h3 class="font-display text-3xl md:text-4xl uppercase leading-tight">Everyone on the same page</h3>
            <p class="text-sm md:text-base leading-relaxed text-ink/70">
              Invite your partner, flatmates or family with a single 6-character code. From that moment on, you all share one recipe book, one planner, and one shopping list — no syncing, no duplicates.
            </p>
          </div>

        </div>
      </div>
    </section>

    <!-- ─── HOW IT WORKS ──────────────────────────────────────────────────── -->
    <section class="border-b-2 border-ink py-16 md:py-24 bg-[color:var(--paper)]">
      <div class="mx-auto max-w-7xl px-4 md:px-8 space-y-12">

        <div class="space-y-2">
          <p class="editorial-kicker">Dead simple</p>
          <h2 class="font-display text-5xl md:text-7xl uppercase leading-none">Up and running<br>in 3 steps.</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 border-2 border-ink">

          <div class="border-b-2 md:border-b-0 md:border-r-2 border-ink p-8 space-y-4">
            <p class="font-display text-[80px] md:text-[100px] leading-none text-brand-500">1</p>
            <h3 class="font-display text-2xl md:text-3xl uppercase">Create your account</h3>
            <p class="text-sm leading-relaxed text-ink/70">
              Sign up with email or Google in under 30 seconds. Give your household a name and you're in.
            </p>
          </div>

          <div class="border-b-2 md:border-b-0 md:border-r-2 border-ink p-8 space-y-4">
            <p class="font-display text-[80px] md:text-[100px] leading-none text-brand-500">2</p>
            <h3 class="font-display text-2xl md:text-3xl uppercase">Add your go-to recipes</h3>
            <p class="text-sm leading-relaxed text-ink/70">
              Paste a recipe URL to import automatically, or enter your own from scratch. Build up your library over time.
            </p>
          </div>

          <div class="p-8 space-y-4">
            <p class="font-display text-[80px] md:text-[100px] leading-none text-brand-500">3</p>
            <h3 class="font-display text-2xl md:text-3xl uppercase">Plan the week and shop</h3>
            <p class="text-sm leading-relaxed text-ink/70">
              Fill in the week's planner, hit Generate, and your shopping list is ready. Invite your household with a code.
            </p>
          </div>

        </div>

        <div class="flex justify-center pt-4">
          <NuxtLink to="/auth/register" class="brutalist-btn-red text-xl px-10 py-4">
            Start for free →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ─── HOUSEHOLD INVITE CALLOUT ──────────────────────────────────────── -->
    <section class="border-b-2 border-ink py-16 md:py-24">
      <div class="mx-auto max-w-7xl px-4 md:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          <div class="space-y-6">
            <p class="editorial-kicker">Made for households</p>
            <h2 class="font-display text-5xl md:text-7xl uppercase leading-none">Cook together.<br>Shop together.</h2>
            <p class="text-base md:text-lg leading-relaxed text-ink/70 max-w-md">
              Share your household with a single invite code. The moment someone joins, they get access to the same planner, recipes and shopping list. Changes sync in real time — no refreshing needed.
            </p>
            <NuxtLink to="/auth/register" class="brutalist-btn-red inline-flex text-lg px-6 py-3">
              Create a household →
            </NuxtLink>
          </div>

          <!-- Invite code mockup -->
          <div class="flex items-center justify-center">
            <div class="brutalist-card bg-[color:var(--paper)] p-8 space-y-6 w-full max-w-sm">
              <div>
                <p class="editorial-kicker mb-2">Household</p>
                <p class="font-display text-4xl uppercase">The Smiths</p>
              </div>
              <div>
                <p class="editorial-kicker mb-3">Invite Code</p>
                <div class="border-2 border-ink bg-cream flex items-center justify-between px-4 py-3 gap-4">
                  <span class="font-display text-5xl tracking-[0.15em] leading-none">MX7K4R</span>
                  <span class="border-2 border-ink bg-[color:var(--paper)] px-3 py-1.5 text-xs font-display uppercase cursor-default">Copy</span>
                </div>
              </div>
              <p class="text-xs uppercase tracking-[0.08em] text-ink/50">3 members in this household</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ─── FINAL CTA ─────────────────────────────────────────────────────── -->
    <section class="bg-brand-500 border-b-2 border-ink py-20 md:py-32">
      <div class="mx-auto max-w-7xl px-4 md:px-8 text-center space-y-8">
        <p class="editorial-kicker mx-auto">Free forever</p>
        <h2 class="font-display uppercase leading-none tracking-[-0.02em] text-[12vw] md:text-[8vw]">
          Start planning<br>this week.
        </h2>
        <p class="text-base md:text-xl text-ink/70 max-w-lg mx-auto leading-relaxed">
          No subscription. No credit card. Just a better way to handle meals at home.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-6 pt-4">
          <NuxtLink to="/auth/register" class="brutalist-btn bg-cream text-xl px-10 py-4">
            Create free account →
          </NuxtLink>
          <NuxtLink to="/auth/login" class="text-sm uppercase tracking-[0.08em] underline underline-offset-4 text-ink/60 hover:text-ink transition-colors">
            Already have an account?
          </NuxtLink>
        </div>
      </div>
    </section>

  </div>
</template>
