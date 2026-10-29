import { describe, expect, it } from 'vitest'
import { findLeftoverDishes } from './leftovers'
import type { Dish } from './types'

function dish(overrides: Partial<Dish> = {}): Dish {
  return {
    id: 'd1',
    name: 'Plat',
    ingredients: [{ name: 'pâtes', quantity: null, unit: null }],
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

describe('findLeftoverDishes', () => {
  it('trouve les plats utilisant les restes', () => {
    const dishes = [
      dish({ id: 'a', name: 'Pâtes', ingredients: [{ name: 'pâtes', quantity: null, unit: null }] }),
      dish({
        id: 'b',
        name: 'Risotto',
        ingredients: [
          { name: 'riz', quantity: null, unit: null },
          { name: 'champignons', quantity: null, unit: null },
        ],
      }),
    ]
    const matches = findLeftoverDishes(['riz', 'champignons'], dishes)
    expect(matches[0].dish.name).toBe('Risotto')
    expect(matches[0].coverage).toBeCloseTo(1)
  })

  it('normalise les accents', () => {
    const dishes = [
      dish({ id: 'a', name: 'Gratin', ingredients: [{ name: 'pommes de terre', quantity: null, unit: null }] }),
    ]
    const matches = findLeftoverDishes(['Pommes de Terre'], dishes)
    expect(matches).toHaveLength(1)
  })

  it('trie par couverture décroissante', () => {
    const dishes = [
      dish({
        id: 'a',
        name: 'Partiel',
        ingredients: [
          { name: 'pâtes', quantity: null, unit: null },
          { name: 'ail', quantity: null, unit: null },
        ],
      }),
      dish({ id: 'b', name: 'Total', ingredients: [{ name: 'pâtes', quantity: null, unit: null }] }),
    ]
    const matches = findLeftoverDishes(['pâtes'], dishes)
    expect(matches[0].dish.name).toBe('Total')
  })

  it('retourne vide sans restes', () => {
    expect(findLeftoverDishes([], [dish()])).toHaveLength(0)
  })

  it('applique le seuil de couverture', () => {
    const dishes = [
      dish({
        id: 'a',
        name: 'Faible couverture',
        ingredients: [
          { name: 'riz', quantity: null, unit: null },
          { name: 'beurre', quantity: null, unit: null },
          { name: 'ail', quantity: null, unit: null },
          { name: 'oignon', quantity: null, unit: null },
        ],
      }),
    ]
    expect(findLeftoverDishes(['riz'], dishes, { minCoverage: 0.3 })).toHaveLength(0)
    expect(findLeftoverDishes(['riz'], dishes, { minCoverage: 0.2 })).toHaveLength(1)
  })
})
