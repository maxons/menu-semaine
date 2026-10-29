import { describe, expect, it } from 'vitest'
import { buildGraph, dishSimilarity, graphRecommendations } from './graph'
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

describe('dishSimilarity', () => {
  it('vaut 1 pour deux plats identiques', () => {
    const dish = makeCatalogDish({
      ingredients: [{ name: 'pâtes', quantity: null, unit: null }, { name: 'ail', quantity: null, unit: null }],
    })
    const { score } = dishSimilarity(dish, dish)
    expect(score).toBeGreaterThan(0.99)
  })

  it('vaut 0 sans ingrédients partagés', () => {
    const a = makeCatalogDish({
      ingredients: [{ name: 'riz', quantity: null, unit: null }],
      category: 'feculent',
    })
    const b = makeCatalogDish({
      ingredients: [{ name: 'saumon', quantity: null, unit: null }],
      category: 'poisson',
    })
    expect(dishSimilarity(a, b).score).toBe(0)
  })

  it('donne un bonus pour même catégorie', () => {
    const a = makeCatalogDish({
      ingredients: [{ name: 'pâtes', quantity: null, unit: null }],
      category: 'feculent',
    })
    const b = makeCatalogDish({
      ingredients: [{ name: 'gnocchi', quantity: null, unit: null }],
      category: 'feculent',
    })
    const sameCategory = dishSimilarity(a, b).score
    b.category = 'poisson'
    const diffCategory = dishSimilarity(a, b).score
    expect(sameCategory).toBeGreaterThan(diffCategory)
  })

  it('normalise les accents et la casse', () => {
    const a = makeCatalogDish({
      ingredients: [{ name: 'Pâtes', quantity: null, unit: null }],
    })
    const b = makeCatalogDish({
      ingredients: [{ name: 'pates', quantity: null, unit: null }],
    })
    expect(dishSimilarity(a, b).score).toBeGreaterThan(0.9)
  })
})

describe('buildGraph', () => {
  it('crée des arêtes seulement pour les plats similaires', () => {
    const catalog = [
      makeCatalogDish({ name: 'A', ingredients: [{ name: 'riz', quantity: null, unit: null }] }),
      makeCatalogDish({ name: 'B', ingredients: [{ name: 'riz', quantity: null, unit: null }] }),
      makeCatalogDish({ name: 'C', ingredients: [{ name: 'kiwi', quantity: null, unit: null }], category: 'fruit' }),
    ]
    const graph = buildGraph(catalog)
    expect(graph.nodes).toHaveLength(3)
    expect(graph.edges.length).toBeGreaterThanOrEqual(1)
    expect(
      graph.edges.every((edge) => edge.sharedIngredients.length > 0),
    ).toBe(true)
  })
})

describe('graphRecommendations', () => {
  it('recommande les plats partageant des ingrédients avec le carnet', () => {
    const userDishes = [
      makeUserDish({ ingredients: [{ name: 'pâtes', quantity: null, unit: null }] }),
    ]
    const close = makeCatalogDish({
      name: 'Proche',
      ingredients: [{ name: 'pâtes', quantity: null, unit: null }, { name: 'ail', quantity: null, unit: null }],
    })
    const far = makeCatalogDish({
      name: 'Loin',
      ingredients: [{ name: 'moules', quantity: null, unit: null }],
      category: 'poisson',
    })
    const result = graphRecommendations(userDishes, [far, close])
    expect(result[0].dish.name).toBe('Proche')
    expect(result[0].reasons[0]).toContain('Proche de')
    expect(result.map((r) => r.dish.name)).not.toContain('Loin')
  })

  it('booste les plats proches de plats souvent servis', () => {
    const rare = makeUserDish({
      id: 'rare',
      ingredients: [{ name: 'quinoa', quantity: null, unit: null }],
      timesServed: 0,
    })
    const frequent = makeUserDish({
      id: 'frequent',
      ingredients: [{ name: 'lentilles', quantity: null, unit: null }],
      timesServed: 10,
    })
    const quinoaDish = makeCatalogDish({
      name: 'Salade quinoa',
      ingredients: [{ name: 'quinoa', quantity: null, unit: null }],
    })
    const lentilDish = makeCatalogDish({
      name: 'Dal lentilles',
      ingredients: [{ name: 'lentilles', quantity: null, unit: null }],
    })
    const result = graphRecommendations([rare, frequent], [
      quinoaDish,
      lentilDish,
    ])
    expect(result[0].dish.name).toBe('Dal lentilles')
  })

  it('exclut les plats déjà dans le carnet', () => {
    const userDishes = [makeUserDish({ name: 'Pâtes pesto' })]
    const catalog = [
      makeCatalogDish({ name: 'Pâtes pesto' }),
      makeCatalogDish({ name: 'Autre', ingredients: [{ name: 'pâtes', quantity: null, unit: null }] }),
    ]
    const result = graphRecommendations(userDishes, catalog)
    expect(result.map((r) => r.dish.name)).not.toContain('Pâtes pesto')
  })

  it('sans carnet, renvoie des plats avec message générique', () => {
    const catalog = [makeCatalogDish({ name: 'Plat' })]
    const result = graphRecommendations([], catalog)
    expect(result[0].reasons[0]).toContain('personnalisées')
  })

  it('normalise les scores entre 0 et 1', () => {
    const userDishes = [
      makeUserDish({ ingredients: [{ name: 'pâtes', quantity: null, unit: null }] }),
      makeUserDish({ id: 'u2', ingredients: [{ name: 'ail', quantity: null, unit: null }] }),
    ]
    const catalog = Array.from({ length: 8 }, (_, i) =>
      makeCatalogDish({
        name: `Plat ${i}`,
        ingredients: [
          { name: 'pâtes', quantity: null, unit: null },
          { name: 'ail', quantity: null, unit: null },
        ],
      }),
    )
    const result = graphRecommendations(userDishes, catalog)
    expect(result.every((r) => r.score >= 0 && r.score <= 1)).toBe(true)
    expect(result[0].score).toBeCloseTo(1, 5)
  })
})
