import { describe, expect, it } from 'vitest'
import { buildUserProfile, recommendDishes, DEFAULT_WEIGHTS } from './recommendation'
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
    rating: 'neutral',
    seasons: [],
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
    seasons: [],
    ...overrides,
  }
}

describe('buildUserProfile', () => {
  it('construit un profil vide sans plats', () => {
    const profile = buildUserProfile([])
    expect(profile.dishCount).toBe(0)
    expect(profile.healthyShare).toBe(0)
    expect(profile.avgDifficulty).toBe(0)
  })

  it('calcule les parts de catégories et healthy', () => {
    const dishes = [
      makeUserDish({ id: 'a', category: 'feculent', healthy: true }),
      makeUserDish({ id: 'b', category: 'viande', healthy: false }),
    ]
    const profile = buildUserProfile(dishes)
    expect(profile.dishCount).toBe(2)
    expect(profile.categoryShares['feculent']).toBeCloseTo(0.5)
    expect(profile.healthyShare).toBeCloseTo(0.5)
    expect(profile.avgDifficulty).toBeCloseTo(1)
  })

  it('compte les ingrédients de manière normalisée', () => {
    const dishes = [
      makeUserDish({ ingredients: [{ name: 'Pâtes', quantity: null, unit: null }] }),
      makeUserDish({ ingredients: [{ name: 'pates', quantity: null, unit: null }] }),
    ]
    const profile = buildUserProfile(dishes)
    expect(profile.ingredientCounts['pates']).toBe(2)
  })
})

describe('recommendDishes', () => {
  it('favorise les plats partageant des ingrédients et catégories du profil', () => {
    const userDishes = [
      makeUserDish({
        ingredients: [{ name: 'pâtes', quantity: 400, unit: 'g' }],
        category: 'feculent',
      }),
    ]
    const similar = makeCatalogDish({
      name: 'Similaire',
      ingredients: [{ name: 'pâtes', quantity: 400, unit: 'g' }],
      category: 'feculent',
    })
    const different = makeCatalogDish({
      name: 'Différent',
      ingredients: [{ name: 'moules', quantity: 1, unit: 'kg' }],
      category: 'poisson',
      difficulty: 'difficile',
      healthy: false,
      utensils: ['cocotte'],
    })
    const result = recommendDishes([different, similar], userDishes)
    expect(result[0].dish.name).toBe('Similaire')
    expect(result[0].score).toBeGreaterThan(result[1].score)
    expect(result[0].reasons.length).toBeGreaterThan(0)
  })

  it("exclut les plats déjà présents chez l'utilisateur", () => {
    const userDishes = [makeUserDish({ name: 'Pâtes pesto' })]
    const catalog = [
      makeCatalogDish({ name: 'Pâtes pesto' }),
      makeCatalogDish({ name: 'Autre plat' }),
    ]
    const result = recommendDishes(catalog, userDishes)
    expect(result.map((r) => r.dish.name)).not.toContain('Pâtes pesto')
    expect(result.map((r) => r.dish.name)).toContain('Autre plat')
  })

  it('respecte la limite demandée', () => {
    const catalog = Array.from({ length: 10 }, (_, i) =>
      makeCatalogDish({ name: `Plat ${i}` }),
    )
    const result = recommendDishes(catalog, [], { limit: 3 })
    expect(result).toHaveLength(3)
  })

  it('sans profil utilisateur, renvoie des plats avec message générique', () => {
    const catalog = [makeCatalogDish({ name: 'Plat' })]
    const result = recommendDishes(catalog, [])
    expect(result[0].reasons[0]).toContain('personnalisées')
  })

  it('donne un score plus élevé aux plats faciles pour un profil facile', () => {
    const userDishes = [makeUserDish({ difficulty: 'facile' })]
    const facile = makeCatalogDish({ name: 'Facile', difficulty: 'facile' })
    const difficile = makeCatalogDish({ name: 'Difficile', difficulty: 'difficile' })
    const result = recommendDishes([difficile, facile], userDishes, {
      weights: { ...DEFAULT_WEIGHTS, ingredients: 0, category: 0, utensils: 0 },
    })
    expect(result[0].dish.name).toBe('Facile')
  })
})
