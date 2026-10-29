export interface Ingredient {
  name: string
  quantity: number | null
  unit: string | null
  priceEur?: number
}

export type DishRating = 'favorite' | 'neutral' | 'avoid'

export type Season = 'hiver' | 'printemps' | 'ete' | 'automne'

export type Difficulty = 'facile' | 'moyen' | 'difficile'

export type IngredientCategory =
  | 'viande'
  | 'poisson'
  | 'legume'
  | 'feculent'
  | 'produit-laitier'
  | 'oeuf'
  | 'fruit'
  | 'epice-aromate'

export interface Dish {
  id: string
  name: string
  ingredients: Ingredient[]
  tags: string[]
  lastServedAt: string | null
  timesServed: number
  difficulty: Difficulty
  healthy: boolean
  pregnancySafe: boolean
  utensils: string[]
  category: IngredientCategory
  rating: DishRating
  seasons: Season[]
}

export type DayOfWeek =
  | 'lundi'
  | 'mardi'
  | 'mercredi'
  | 'jeudi'
  | 'vendredi'
  | 'samedi'
  | 'dimanche'

export const DAYS: DayOfWeek[] = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
]

export interface Meal {
  day: DayOfWeek
  dishId: string | null
  forced: boolean
}

export interface Menu {
  weekStart: string
  meals: Meal[]
}

export interface GenerateOptions {
  dishes: Dish[]
  currentMenu: Menu
  rng?: () => number
  constraint?: WeekConstraint
}

export type WeekConstraint =
  | 'none'
  | 'pregnancy'
  | 'healthy'
  | 'mostly-healthy'

export const WEEK_CONSTRAINT_LABELS: Record<WeekConstraint, string> = {
  none: 'Semaine normale',
  pregnancy: 'Grossesse (contrainte forte)',
  healthy: 'Healthy (contrainte forte)',
  'mostly-healthy': 'Plutôt healthy',
}

export interface CatalogDish {
  name: string
  ingredients: Ingredient[]
  tags: string[]
  difficulty: Difficulty
  healthy: boolean
  pregnancySafe: boolean
  utensils: string[]
  category: IngredientCategory
  seasons: Season[]
}

export const RATING_LABELS: Record<DishRating, string> = {
  favorite: 'Favori',
  neutral: 'Neutre',
  avoid: 'À éviter',
}

export interface Recommendation {
  dish: CatalogDish
  score: number
  reasons: string[]
}

export interface UserTasteProfile {
  ingredientCounts: Record<string, number>
  categoryShares: Record<string, number>
  avgDifficulty: number
  healthyShare: number
  utensilShares: Record<string, number>
  dishCount: number
}
