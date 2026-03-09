import type { Timestamp } from 'firebase/firestore'

// ─── Users & Households ────────────────────────────────────────────────────

export interface AppUser {
  uid: string
  email: string
  displayName: string
  householdId: string | null
  createdAt: Timestamp
}

export interface Household {
  id: string
  name: string
  members: string[]        // array of UIDs
  inviteCode: string
  createdAt: Timestamp
  createdBy: string
}

// ─── Recipes ───────────────────────────────────────────────────────────────

export interface Ingredient {
  name: string
  quantity: string
  unit: string
}

export interface Recipe {
  id: string
  householdId: string
  name: string
  sourceUrl?: string
  description?: string
  servings?: number
  prepTime?: string
  cookTime?: string
  ingredients: Ingredient[]
  tags: string[]
  notes?: string
  imageUrl?: string
  addedBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Partial form used during add/edit — no id or timestamps yet
export type RecipeFormData = Omit<Recipe, 'id' | 'householdId' | 'addedBy' | 'createdAt' | 'updatedAt'>

// ─── Weekly Planner ────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type DayKey  = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

// A slot holds a recipeId, the string "eating_out", or null (unplanned)
export type SlotValue = string | 'eating_out' | null

export type WeekSlots = {
  [day in DayKey]: {
    [meal in MealType]: SlotValue
  }
}

export interface WeeklyPlan {
  id: string
  householdId: string
  weekStartDate: string   // ISO date string for the Monday, e.g. "2024-06-10"
  slots: WeekSlots
  updatedAt: Timestamp
  updatedBy: string
}

// ─── Shopping List ─────────────────────────────────────────────────────────

export type IngredientCategory =
  | 'Produce'
  | 'Meat & Fish'
  | 'Dairy & Eggs'
  | 'Bakery'
  | 'Pantry'
  | 'Frozen'
  | 'Drinks'
  | 'Other'

export interface ShoppingItem {
  id: string              // generated client-side for checklist key
  name: string
  quantity: string
  unit: string
  category: IngredientCategory
  checked: boolean
  recipeNames: string[]   // which recipes this item came from
}

// ─── URL Import ────────────────────────────────────────────────────────────

export interface ImportedRecipe {
  name: string
  description?: string
  servings?: number
  prepTime?: string
  cookTime?: string
  ingredients: Ingredient[]
  imageUrl?: string
  sourceUrl: string
}
