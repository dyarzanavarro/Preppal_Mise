import { defineStore } from 'pinia'
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { ShoppingItem, IngredientCategory } from '~/types'

const CATEGORY_ORDER: IngredientCategory[] = [
  'Produce', 'Meat & Fish', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Frozen', 'Drinks', 'Other',
]

export const useShoppingStore = defineStore('shopping', () => {
  const { db } = useFirebase()

  const items   = ref<ShoppingItem[]>([])
  const loading = ref(false)

  let _householdId = ''
  let _weekStart   = ''
  let unsub: Unsubscribe | null = null

  // ── grouping ─────────────────────────────────────────────────────────────

  const grouped = computed<Record<IngredientCategory, ShoppingItem[]>>(() => {
    const result = {} as Record<IngredientCategory, ShoppingItem[]>
    for (const cat of CATEGORY_ORDER) result[cat] = []
    for (const item of items.value) result[item.category].push(item)
    return result
  })

  const categoriesWithItems = computed(() =>
    CATEGORY_ORDER.filter((cat) => grouped.value[cat].length > 0),
  )

  // ── Firestore ────────────────────────────────────────────────────────────

  function subscribe(householdId: string, weekStart: string) {
    // Avoid redundant re-subscriptions for the same doc
    if (unsub && _householdId === householdId && _weekStart === weekStart) return

    unsub?.()
    _householdId = householdId
    _weekStart   = weekStart
    loading.value = true

    const ref = doc(db, 'shoppingLists', `${householdId}_${weekStart}`)
    unsub = onSnapshot(ref, (snap) => {
      items.value   = snap.exists() ? (snap.data().items ?? []) : []
      loading.value = false
    })
  }

  function unsubscribeAll() {
    unsub?.()
    unsub         = null
    items.value   = []
    loading.value = false
    _householdId  = ''
    _weekStart    = ''
  }

  async function saveItems(newItems: ShoppingItem[]) {
    if (!_householdId || !_weekStart) return
    // Optimistic local update so the UI doesn't wait for the round-trip
    items.value = newItems
    await setDoc(
      doc(db, 'shoppingLists', `${_householdId}_${_weekStart}`),
      {
        householdId:   _householdId,
        weekStartDate: _weekStart,
        items:         newItems,
        updatedAt:     serverTimestamp(),
      },
    )
  }

  async function toggleItem(id: string) {
    await saveItems(
      items.value.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    )
  }

  async function uncheckAll() {
    await saveItems(items.value.map((i) => ({ ...i, checked: false })))
  }

  async function addItem(input: {
    name: string
    quantity?: string
    unit?: string
    category?: IngredientCategory
  }) {
    const name = input.name.trim()
    if (!name) return

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name,
      quantity: input.quantity?.trim() ?? '',
      unit: input.unit?.trim() ?? '',
      category: input.category ?? 'Other',
      checked: false,
      recipeNames: ['Manual'],
    }

    await saveItems([...items.value, newItem])
  }

  async function deleteItem(id: string) {
    await saveItems(items.value.filter((i) => i.id !== id))
  }

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
    loading,
    categoryOrder: CATEGORY_ORDER,
    grouped,
    categoriesWithItems,
    subscribe,
    unsubscribeAll,
    saveItems,
    toggleItem,
    uncheckAll,
    addItem,
    deleteItem,
    toClipboardText,
  }
})
