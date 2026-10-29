import { describe, expect, it } from 'vitest'
import { hybridRecommendations } from './hybrid'
import type { CatalogDish, Dish } from './types'

function makeUserDish(overrides: Partial<Dish> = {}): Dish {
  return {
    id: 'u1',
    name: 'User dish',
    ingredients: [{ name: 'pâtes', quantity: 400, unit: 'g' }],
    tags: [],
    lastServedAt: null,
    timesServed: 0,
    difficulty: 'facile',
    healthy: true,
    pregnancySafe: true,
    utensils: ['casserole'],
    category: 'feculent',
    ...overrides,
  }
}

function makeCatalogDish(overrides: Partial<CatalogDish> = {}): CatalogDish {
  return {
    name: 'Catalog dish',
    ingredients: [],
    tags: [],
    difficulty: 'facile',
    healthy: true,
    pregnancySafe: true,
    utensils: [],
    category: 'feculent',
    ...overrides,
  }
}

describe('hybridRecommendations', () => {
  it('combine similarité de composition et affinité de profil', () => {
    const userDishes = [
      makeUserDish({
        ingredients: [{ name: 'pâtes', quantity: null, unit: null }],
        category: 'feculent',
        difficulty: 'facile',
        healthy: true,
      }),
    ]
    const proche = makeCatalogDish({
      name: 'Proche',
      ingredients: [{ name: 'pâtes', quantity: null, unit: null }, { name: 'ail', quantity: null, unit: null }],
      category: 'feculent',
      difficulty: 'facile',
      healthy: true,
    })
    const loin = makeCatalogDish({
      name: 'Loin',
      ingredients: [{ name: 'moules', quantity: null, unit: null }],
      category: 'poisson',
      difficulty: 'difficile',
      healthy: false,
    })
    const result = hybridRecommendations(userDishes, [loin, proche])
    expect(result[0].dish.name).toBe('Proche')
    expect(result[0].score).toBeGreaterThan(result[1]?.score ?? 0)
  })

  it('exclut les plats du carnet', () => {
    const userDishes = [makeUserDish({ name: 'Pâtes pesto' })]
    const catalog = [
      makeCatalogDish({ name: 'Pâtes pesto' }),
      makeCatalogDish({ name: 'Autre', ingredients: [{ name: 'pâtes', quantity: null, unit: null }] }),
    ]
    const result = hybridRecommendations(userDishes, catalog)
    expect(result.map((r) => r.dish.name)).not.toContain('Pâtes pesto')
  })

  it('donne des raisons exploitables', () => {
    const userDishes = [
      makeUserDish({ ingredients: [{ name: 'pâtes', quantity: null, unit: null }] }),
    ]
    const proche = makeCatalogDish({
      name: 'Proche',
      ingredients: [{ name: 'pâtes', quantity: null, unit: null }],
    })
    const result = hybridRecommendations(userDishes, [proche])
    expect(result[0].reasons.length).toBeGreaterThan(0)
  })

  it('sans carnet, renvoie un message générique', () => {
    const result = hybridRecommendations([], [makeCatalogDish({ name: 'Plat' })])
    expect(result[0].reasons[0]).toContain('personnalisées')
  })

  it('les poids sont ajustables (graphe seul ignore le profil)', () => {
    const userDishes = [
      makeUserDish({
        ingredients: [{ name: 'quinoa', quantity: null, unit: null }],
        healthy: true,
        category: 'legume',
      }),
    ]
    const healthyMatch = makeCatalogDish({
      name: 'Sain',
      ingredients: [{ name: 'quinoa', quantity: null, unit: null }],
      healthy: true,
    })
    const indulgent = makeCatalogDish({
      name: 'Gourmand',
      ingredients: [{ name: 'quinoa', quantity: null, unit: null }],
      healthy: false,
    })
    const graphOnly = hybridRecommendations(userDishes, [indulgent, healthyMatch], {
      profileWeight: 0,
      graphWeight: 1,
    })
    expect(graphOnly[0].score).toBeCloseTo(graphOnly[1].score, 5)

    const hybrid = hybridRecommendations(userDishes, [indulgent, healthyMatch])
    expect(hybrid[0].dish.name).toBe('Sain')
  })
})
