export interface Dish {
  id: string
  name: string
  ingredients: Ingredient[]
  tags: string[]
  lastServedAt: string | null
  timesServed: number
}

export interface Ingredient {
  name: string
  quantity: number | null
  unit: string | null
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
}
