import type {
  ShoppingItem,
  IngredientCategory,
  WeeklyPlan,
  Recipe,
} from '~/types'

// ── Category inference ─────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  'Produce':      ['apple','banana','berry','berries','broccoli','carrot','celery','cherry','courgette',
                   'cucumber','garlic','ginger','grape','kale','leek','lemon','lettuce','lime','mango',
                   'mushroom','onion','orange','parsley','pear','pepper','potato','spinach','spring onion',
                   'sweet potato','thyme','tomato','vegetable','zucchini','herb','basil','coriander',
                   'mint','rosemary','sage','chilli','avocado','aubergine','eggplant','fennel','radish'],
  'Meat & Fish':  ['beef','chicken','cod','duck','fish','haddock','lamb','mince','pork','prawn','salmon',
                   'sausage','seafood','shrimp','steak','tuna','turkey','bacon','ham','chorizo','anchovy'],
  'Dairy & Eggs': ['butter','cheese','cream','crème fraîche','egg','milk','mozzarella','parmesan',
                   'ricotta','yogurt','yoghurt','cheddar','feta','halloumi','brie','gouda'],
  'Bakery':       ['bagel','baguette','biscuit','bread','brioche','crumpet','croissant','flatbread',
                   'focaccia','loaf','naan','pitta','roll','sourdough','tortilla','wrap'],
  'Pantry':       ['almond','bean','black pepper','broth','butter bean','cannellini','canned','chickpea',
                   'chocolate','coconut','cornstarch','cornflour','cumin','flour','honey','jam',
                   'kidney bean','lentil','maple','mustard','noodle','nut','oat','oil','olive oil',
                   'oregano','paprika','pasta','peanut','pepper','pine nut','quinoa','rice','salt',
                   'sauce','seed','sesame','soy','spice','stock','sugar','sunflower','tahini',
                   'turmeric','vanilla','vinegar','walnut','worcestershire'],
  'Frozen':       ['frozen','ice cream','sorbet'],
  'Drinks':       ['beer','coffee','juice','milk','smoothie','tea','water','wine'],
  'Other':        [],
}

function guessCategory(ingredientName: string): IngredientCategory {
  const lower = ingredientName.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [IngredientCategory, string[]][]) {
    if (cat === 'Other') continue
    if (keywords.some((kw) => lower.includes(kw))) return cat
  }
  return 'Other'
}

// ── Quantity merging ───────────────────────────────────────────────────────

/**
 * Best-effort numeric merge: "2 tbsp" + "1 tbsp" → "3 tbsp".
 * Falls back to comma-joining when units differ.
 */
function mergeQuantities(
  existing: { quantity: string; unit: string },
  incoming: { quantity: string; unit: string },
): { quantity: string; unit: string } {
  const a = parseFloat(existing.quantity)
  const b = parseFloat(incoming.quantity)
  const sameUnit = existing.unit.toLowerCase() === incoming.unit.toLowerCase()

  if (!isNaN(a) && !isNaN(b) && sameUnit) {
    return { quantity: String(a + b), unit: existing.unit }
  }
  // Different units — surface both
  const qA = [existing.quantity, existing.unit].filter(Boolean).join(' ')
  const qB = [incoming.quantity, incoming.unit].filter(Boolean).join(' ')
  return { quantity: `${qA}, ${qB}`, unit: '' }
}

// ── Main composable ────────────────────────────────────────────────────────

export function useShoppingList(plan: Ref<WeeklyPlan | null>, recipes: Ref<Recipe[]>) {
  const items = ref<ShoppingItem[]>([])

  function generate() {
    if (!plan.value) return

    // Collect all recipe IDs from the plan (deduped)
    const recipeIds = new Set<string>()
    for (const day of Object.values(plan.value.slots)) {
      for (const meal of Object.values(day)) {
        if (meal && meal !== 'eating_out') recipeIds.add(meal)
      }
    }

    // Build a normalised ingredient map: "name::unit" → ShoppingItem
    const map = new Map<string, ShoppingItem>()

    for (const id of recipeIds) {
      const recipe = recipes.value.find((r) => r.id === id)
      if (!recipe) continue

      for (const ing of recipe.ingredients) {
        const key = `${ing.name.toLowerCase().trim()}::${ing.unit.toLowerCase().trim()}`

        if (map.has(key)) {
          const existing = map.get(key)!
          const merged = mergeQuantities(existing, ing)
          existing.quantity = merged.quantity
          existing.unit     = merged.unit
          if (!existing.recipeNames.includes(recipe.name)) {
            existing.recipeNames.push(recipe.name)
          }
        } else {
          map.set(key, {
            id:          crypto.randomUUID(),
            name:        ing.name.trim(),
            quantity:    ing.quantity,
            unit:        ing.unit,
            category:    guessCategory(ing.name),
            checked:     false,
            recipeNames: [recipe.name],
          })
        }
      }
    }

    items.value = [...map.values()]
  }

  // ── category grouping ────────────────────────────────────────────────────

  const CATEGORY_ORDER: IngredientCategory[] = [
    'Produce', 'Meat & Fish', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Frozen', 'Drinks', 'Other',
  ]

  const grouped = computed<Record<IngredientCategory, ShoppingItem[]>>(() => {
    const result = {} as Record<IngredientCategory, ShoppingItem[]>
    for (const cat of CATEGORY_ORDER) result[cat] = []
    for (const item of items.value) result[item.category].push(item)
    return result
  })

  const categoriesWithItems = computed(() =>
    CATEGORY_ORDER.filter((cat) => grouped.value[cat].length > 0),
  )

  // ── checklist ────────────────────────────────────────────────────────────

  function toggleItem(id: string) {
    const item = items.value.find((i) => i.id === id)
    if (item) item.checked = !item.checked
  }

  function uncheckAll() {
    items.value.forEach((i) => { i.checked = false })
  }

  // ── clipboard export ─────────────────────────────────────────────────────

  function toClipboardText(): string {
    const lines: string[] = ['🛒 Shopping List\n']
    for (const cat of categoriesWithItems.value) {
      lines.push(`\n${cat}`)
      for (const item of grouped.value[cat]) {
        const q = [item.quantity, item.unit].filter(Boolean).join(' ')
        lines.push(`  ${item.checked ? '✓' : '•'} ${q ? q + ' ' : ''}${item.name}`)
      }
    }
    return lines.join('\n')
  }

  return {
    items,
    grouped,
    categoriesWithItems,
    generate,
    toggleItem,
    uncheckAll,
    toClipboardText,
  }
}
