import type { Dish, Menu } from './types'
import { estimateIngredientPriceEur } from '../data/prices'

export function estimateDishPrice(dish: Dish): number {
  return round2(
    dish.ingredients.reduce(
      (sum, ingredient) =>
        sum +
        (ingredient.priceEur ??
          estimateIngredientPriceEur(
            ingredient.name,
            ingredient.quantity,
            ingredient.unit,
          )),
      0,
    ),
  )
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export interface BudgetSummary {
  total: number
  byMeal: { dishId: string; price: number }[]
  averagePerMeal: number
}

export function estimateWeeklyBudget(menu: Menu, dishes: Dish[]): BudgetSummary {
  const dishById = new Map(dishes.map((dish) => [dish.id, dish]))
  const byMeal: BudgetSummary['byMeal'] = []
  let total = 0
  for (const meal of menu.meals) {
    if (!meal.dishId) continue
    const dish = dishById.get(meal.dishId)
    if (!dish) continue
    const servings = meal.servings ?? 2
    const price = round2(estimateDishPrice(dish) * (servings / 2))
    total += price
    byMeal.push({ dishId: meal.dishId, price })
  }
  const mealCount = byMeal.length
  return {
    total,
    byMeal,
    averagePerMeal: mealCount === 0 ? 0 : total / mealCount,
  }
}

export interface BudgetAlert {
  type: 'over-threshold' | 'empty'
  message: string
}

export function budgetAlerts(
  summary: BudgetSummary,
  thresholdEur: number | null,
): BudgetAlert[] {
  const alerts: BudgetAlert[] = []
  if (summary.byMeal.length === 0) {
    alerts.push({ type: 'empty', message: 'Génère un menu pour voir le budget de la semaine.' })
  }
  if (thresholdEur !== null && summary.total > thresholdEur) {
    alerts.push({
      type: 'over-threshold',
      message: `Budget dépassé : ${(summary.total).toFixed(2)} € contre ${(thresholdEur).toFixed(2)} € prévus.`,
    })
  }
  return alerts
}
