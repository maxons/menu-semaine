import { describe, expect, it } from 'vitest'
import { budgetAlerts, estimateDishPrice, estimateWeeklyBudget } from './budget'
import type { Dish, Menu } from './types'
import { DAYS } from './types'

function dish(overrides: Partial<Dish> = {}): Dish {
  return {
    id: 'd1',
    name: 'Plat',
    ingredients: [
      { name: 'pâtes', quantity: 500, unit: 'g', priceEur: 1.5 },
      { name: 'crème', quantity: 20, unit: 'cl', priceEur: 1 },
    ],
    tags: [],
    lastServedAt: null,
    timesServed: 0,
    difficulty: 'facile',
    healthy: false,
    pregnancySafe: true,
    utensils: [],
    category: 'feculent',
    rating: 'neutral',
    seasons: [],
    ...overrides,
  }
}

function menuWith(dishIds: (string | null)[]): Menu {
  return {
    weekStart: '2025-01-06',
    meals: DAYS.map((day, index) => ({
      day,
      dishId: dishIds[index] ?? null,
      forced: false,
      servings: 2,
    })),
  }
}

describe('estimateDishPrice', () => {
  it('somme les prix des ingrédients', () => {
    expect(estimateDishPrice(dish())).toBeCloseTo(2.5)
  })

  it('estime via le dictionnaire de prix pour un ingrédient sans prix explicite', () => {
    const result = estimateDishPrice(
      dish({ ingredients: [{ name: 'ail', quantity: null, unit: null }] }),
    )
    expect(result).toBeCloseTo(0.12)
  })
})

describe('estimateWeeklyBudget', () => {
  it('additionne les plats planifiés', () => {
    const dishes = [dish({ id: 'a' }), dish({ id: 'b' })]
    const summary = estimateWeeklyBudget(menuWith(['a', 'b']), dishes)
    expect(summary.total).toBeCloseTo(5)
    expect(summary.byMeal).toHaveLength(2)
    expect(summary.averagePerMeal).toBeCloseTo(2.5)
  })

  it('ignore les repas vides', () => {
    const summary = estimateWeeklyBudget(menuWith([null]), [dish()])
    expect(summary.total).toBe(0)
    expect(summary.averagePerMeal).toBe(0)
  })
})

describe('budgetAlerts', () => {
  it('alerte quand le budget dépasse le seuil', () => {
    const summary = { total: 40, byMeal: [{ dishId: 'a', price: 40 }], averagePerMeal: 40 }
    const alerts = budgetAlerts(summary, 30)
    expect(alerts.some((alert) => alert.type === 'over-threshold')).toBe(true)
  })

  it('pas d\u2019alerte sous le seuil', () => {
    const summary = { total: 10, byMeal: [{ dishId: 'a', price: 10 }], averagePerMeal: 10 }
    expect(budgetAlerts(summary, 30)).toHaveLength(0)
  })

  it('message vide sans repas planifié', () => {
    const summary = { total: 0, byMeal: [], averagePerMeal: 0 }
    const alerts = budgetAlerts(summary, 30)
    expect(alerts.some((alert) => alert.type === 'empty')).toBe(true)
  })
})

describe('budget et nombre de couverts', () => {
  it('double le prix pour 4 couverts', () => {
    const dishes = [dish({ id: 'a' })]
    const menu: Menu = {
      weekStart: '2025-01-06',
      meals: DAYS.map((day, index) => ({
        day,
        dishId: index === 0 ? 'a' : null,
        forced: false,
        servings: 4,
      })),
    }
    const summary = estimateWeeklyBudget(menu, dishes)
    expect(summary.total).toBeCloseTo(5)
  })

  it('garde le prix de base pour 2 couverts', () => {
    const dishes = [dish({ id: 'a' })]
    const menu: Menu = {
      weekStart: '2025-01-06',
      meals: DAYS.map((day, index) => ({
        day,
        dishId: index === 0 ? 'a' : null,
        forced: false,
        servings: 2,
      })),
    }
    const summary = estimateWeeklyBudget(menu, dishes)
    expect(summary.total).toBeCloseTo(2.5)
  })

  it('moitié du prix pour 1 couvert', () => {
    const dishes = [dish({ id: 'a' })]
    const menu: Menu = {
      weekStart: '2025-01-06',
      meals: DAYS.map((day, index) => ({
        day,
        dishId: index === 0 ? 'a' : null,
        forced: false,
        servings: 1,
      })),
    }
    const summary = estimateWeeklyBudget(menu, dishes)
    expect(summary.total).toBeCloseTo(1.25)
  })
})
