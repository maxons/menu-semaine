import { describe, expect, it } from 'vitest'
import { buildShoppingList } from './shopping'
import type { Dish, Menu } from './types'
import { DAYS } from './types'

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

const dishes: Dish[] = [
  {
    difficulty: 'facile',
    healthy: false,
    pregnancySafe: true,
    utensils: [],
    category: 'produit-laitier',
    rating: 'neutral',
    seasons: [],
    id: 'a',
    name: 'Gratin',
    ingredients: [
      { name: 'Pommes de terre', quantity: 1, unit: 'kg' },
      { name: 'crème', quantity: 20, unit: 'cl' },
    ],
    tags: [],
    lastServedAt: null,
    timesServed: 0,
  },
  {
    difficulty: 'facile',
    healthy: false,
    pregnancySafe: false,
    utensils: [],
    category: 'feculent',
    rating: 'neutral',
    seasons: [],
    id: 'b',
    name: 'Pâtes carbonara',
    ingredients: [
      { name: 'pates', quantity: 500, unit: 'g' },
      { name: 'Crème', quantity: 10, unit: 'cl' },
    ],
    tags: [],
    lastServedAt: null,
    timesServed: 0,
  },
]

describe('buildShoppingList', () => {
  it('agrège les ingrédients de plusieurs plats sans doublon', () => {
    const list = buildShoppingList(menuWith(['a', 'b']), dishes)
    const creme = list.find((item) => item.name.toLowerCase().includes('crème'))
    expect(creme?.quantity).toBe(30)
    expect(creme?.unit).toBe('cl')
    expect(list).toHaveLength(3)
  })

  it('ignore les repas vides', () => {
    const list = buildShoppingList(menuWith([null, null]), dishes)
    expect(list).toHaveLength(0)
  })

  it('ignore les plats inconnus', () => {
    const list = buildShoppingList(menuWith(['inconnu']), dishes)
    expect(list).toHaveLength(0)
  })

  it('garde des unités différentes séparées', () => {
    const list = buildShoppingList(menuWith(['a', 'b']), dishes)
    const noms = list.map((item) => item.name)
    expect(noms).toContain('Pommes de terre')
    expect(noms).toContain('pates')
  })
})

describe('liste de courses et nombre de couverts', () => {
  it('multiplie les quantités par le nombre de couverts', () => {
    const menu: Menu = {
      weekStart: '2025-01-06',
      meals: DAYS.map((day, index) => ({
        day,
        dishId: index === 0 ? 'a' : null,
        forced: false,
        servings: 4,
      })),
    }
    const list = buildShoppingList(menu, dishes)
    const creme = list.find((item) => item.name.toLowerCase().includes('crème'))
    expect(creme?.quantity).toBe(40)
  })
})
