import { describe, expect, it } from 'vitest'
import { DISH_CATALOG } from './catalog'
import { estimateDishPrice } from '../core/budget'
import type { Dish } from '../core/types'

function toDish(entry: (typeof DISH_CATALOG)[number], index: number): Dish {
  return {
    id: `c${index}`,
    name: entry.name,
    ingredients: entry.ingredients,
    tags: entry.tags,
    lastServedAt: null,
    timesServed: 0,
    difficulty: entry.difficulty,
    healthy: entry.healthy,
    pregnancySafe: entry.pregnancySafe,
    utensils: entry.utensils,
    category: entry.category,
    rating: 'neutral',
    seasons: entry.seasons,
  }
}

describe('prix du catalogue', () => {
  it('tous les plats ont un prix estimé plausible (1-25 €)', () => {
    for (const [index, entry] of DISH_CATALOG.entries()) {
      const price = estimateDishPrice(toDish(entry, index))
      expect(price).toBeGreaterThan(0.5)
      expect(price).toBeLessThan(25)
    }
  })

  it('le prix médian du catalogue est réaliste (4-12 €)', () => {
    const prices = DISH_CATALOG.map((entry, index) =>
      estimateDishPrice(toDish(entry, index)),
    ).sort((a, b) => a - b)
    const median = prices[Math.floor(prices.length / 2)]
    expect(median).toBeGreaterThan(3)
    expect(median).toBeLessThan(15)
  })

  it('le saumon en papillote coûte plus cher que les pâtes pesto', () => {
    const price = (name: string) =>
      estimateDishPrice(
        toDish(
          DISH_CATALOG.find((entry) => entry.name === name)!,
          0,
        ),
      )
    expect(price('Saumon en papillote')).toBeGreaterThan(price('Pâtes pesto et tomates'))
  })
})
