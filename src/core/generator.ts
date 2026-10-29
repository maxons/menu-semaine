import type { Dish, GenerateOptions, Meal, Menu, WeekConstraint } from './types'
import { DAYS } from './types'

const HALF_LIFE_DAYS = 14
const SOFT_PENALTY = 0.2

export function dishWeight(dish: Dish, now: Date): number {
  if (dish.lastServedAt === null) return 1
  const last = new Date(dish.lastServedAt).getTime()
  const days = Math.max(0, (now.getTime() - last) / (1000 * 60 * 60 * 24))
  return 0.05 + 0.95 * (1 - Math.pow(0.5, days / HALF_LIFE_DAYS))
}

export function satisfiesHardConstraint(dish: Dish, constraint: WeekConstraint): boolean {
  if (constraint === 'pregnancy') return dish.pregnancySafe
  if (constraint === 'healthy') return dish.healthy
  return true
}

function softFactor(dish: Dish, constraint: WeekConstraint): number {
  if (constraint === 'mostly-healthy' && !dish.healthy) return SOFT_PENALTY
  return 1
}

function pickWeighted(dishes: Dish[], weights: number[], rng: () => number): Dish {
  const total = weights.reduce((sum, w) => sum + w, 0)
  let threshold = rng() * total
  for (let i = 0; i < dishes.length; i++) {
    threshold -= weights[i]
    if (threshold <= 0) return dishes[i]
  }
  return dishes[dishes.length - 1]
}

export function generateMenu(options: GenerateOptions): Menu {
  const { dishes, currentMenu, rng = Math.random, constraint = 'none' } = options
  const now = new Date()

  const mealsByDay = new Map(currentMenu.meals.map((meal) => [meal.day, meal]))
  const usedDishIds = new Set(
    currentMenu.meals.filter((m) => m.forced && m.dishId).map((m) => m.dishId),
  )

  const meals: Meal[] = DAYS.map((day) => {
    const existing = mealsByDay.get(day)
    if (existing?.forced && existing.dishId) {
      return { day, dishId: existing.dishId, forced: true }
    }

    const available = dishes.filter(
      (dish) =>
        (!usedDishIds.has(dish.id) ||
          (existing?.dishId === dish.id && existing.forced)) &&
        satisfiesHardConstraint(dish, constraint),
    )
    if (available.length === 0) {
      return { day, dishId: existing?.dishId ?? null, forced: false }
    }

    const weights = available.map(
      (dish) => dishWeight(dish, now) * softFactor(dish, constraint),
    )
    const picked = pickWeighted(available, weights, rng)
    usedDishIds.add(picked.id)
    return { day, dishId: picked.id, forced: false }
  })

  return { weekStart: currentMenu.weekStart, meals }
}

export function updateDishStats(
  dishes: Dish[],
  menu: Menu,
): Dish[] {
  const servedIds = new Set(
    menu.meals.filter((m) => m.dishId).map((m) => m.dishId as string),
  )
  const now = new Date().toISOString()
  return dishes.map((dish) =>
    servedIds.has(dish.id)
      ? { ...dish, lastServedAt: now, timesServed: dish.timesServed + 1 }
      : dish,
  )
}
