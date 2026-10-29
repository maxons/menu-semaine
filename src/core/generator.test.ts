import { describe, expect, it } from 'vitest'
import {
  dishWeight,
  generateMenu,
  satisfiesHardConstraint,
  updateDishStats,
} from './generator'
import type { Dish, Menu } from './types'
import { DAYS } from './types'

function makeDish(overrides: Partial<Dish> = {}): Dish {
  return {
    id: 'd1',
    name: 'Plat test',
    ingredients: [],
    tags: [],
    lastServedAt: null,
    timesServed: 0,
    difficulty: 'facile',
    healthy: true,
    pregnancySafe: true,
    utensils: [],
    category: 'legume',
    rating: 'neutral',
    seasons: [],
    ...overrides,
  }
}

function emptyMenu(): Menu {
  return {
    weekStart: '2025-01-06',
    meals: DAYS.map((day) => ({ day, dishId: null, forced: false, servings: 2 })),
  }
}

describe('dishWeight', () => {
  it('vaut 1 pour un plat jamais servi', () => {
    expect(dishWeight(makeDish(), new Date())).toBe(1)
  })

  it('donne un poids plus élevé à un plat servi il y a longtemps', () => {
    const now = new Date('2025-01-15T00:00:00Z')
    const recent = makeDish({ lastServedAt: '2025-01-14T00:00:00Z' })
    const old = makeDish({ lastServedAt: '2024-12-01T00:00:00Z' })
    expect(dishWeight(old, now)).toBeGreaterThan(dishWeight(recent, now))
  })
})

describe('generateMenu', () => {
  it('remplit tous les repas avec des plats distincts', () => {
    const dishes = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id, i) =>
      makeDish({ id, name: `Plat ${id}`, timesServed: i }),
    )
    const menu = generateMenu({ dishes, currentMenu: emptyMenu(), rng: () => 0.5 })
    expect(menu.meals).toHaveLength(7)
    const ids = menu.meals.map((m) => m.dishId)
    expect(new Set(ids).size).toBe(7)
    for (const id of ids) expect(dishes.map((d) => d.id)).toContain(id)
  })

  it('respecte les repas forcés', () => {
    const dishes = [makeDish({ id: 'a' }), makeDish({ id: 'b' })]
    const current = {
      ...emptyMenu(),
      meals: emptyMenu().meals.map((meal) =>
        meal.day === 'lundi' ? { ...meal, dishId: 'a', forced: true } : meal,
      ),
    }
    const menu = generateMenu({ dishes, currentMenu: current })
    const lundi = menu.meals.find((m) => m.day === 'lundi')
    expect(lundi?.dishId).toBe('a')
    expect(lundi?.forced).toBe(true)
  })

  it('ne réutilise pas un plat déjà tiré dans la semaine', () => {
    const dishes = [makeDish({ id: 'a' }), makeDish({ id: 'b' })]
    const menu = generateMenu({ dishes, currentMenu: emptyMenu(), rng: () => 0.99 })
    const ids = new Set(menu.meals.map((m) => m.dishId))
    expect(ids.has('a')).toBe(true)
    expect(ids.has('b')).toBe(true)
  })

  it('laisse le repas vide si aucun plat disponible', () => {
    const menu = generateMenu({ dishes: [], currentMenu: emptyMenu() })
    expect(menu.meals.every((m) => m.dishId === null)).toBe(true)
  })
})

describe('satisfiesHardConstraint', () => {
  it('filtre les plats non sûrs en contrainte grossesse', () => {
    const safe = makeDish({ id: 'safe', pregnancySafe: true })
    const unsafe = makeDish({ id: 'unsafe', pregnancySafe: false })
    expect(satisfiesHardConstraint(safe, 'pregnancy')).toBe(true)
    expect(satisfiesHardConstraint(unsafe, 'pregnancy')).toBe(false)
  })

  it('filtre les plats non healthy en contrainte healthy', () => {
    const healthy = makeDish({ id: 'h', healthy: true })
    const indulgent = makeDish({ id: 'i', healthy: false })
    expect(satisfiesHardConstraint(healthy, 'healthy')).toBe(true)
    expect(satisfiesHardConstraint(indulgent, 'healthy')).toBe(false)
  })

  it('accepte tout en semaine normale', () => {
    expect(satisfiesHardConstraint(makeDish({ healthy: false }), 'none')).toBe(true)
  })
})

describe('contraintes de semaine dans generateMenu', () => {
  it('contrainte grossesse : ne tire que des plats sûrs', () => {
    const dishes = [
      makeDish({ id: 'a', pregnancySafe: true }),
      makeDish({ id: 'b', pregnancySafe: false }),
    ]
    for (let i = 0; i < 20; i++) {
      const menu = generateMenu({
        dishes,
        currentMenu: emptyMenu(),
        rng: () => 0.99,
        constraint: 'pregnancy',
      })
      const ids = menu.meals.map((m) => m.dishId)
      expect(ids).not.toContain('b')
      expect(new Set(ids.filter(Boolean))).toEqual(new Set(['a']))
    }
  })

  it('contrainte healthy : ne tire que des plats healthy', () => {
    const dishes = [
      makeDish({ id: 'a', healthy: true }),
      makeDish({ id: 'b', healthy: false }),
    ]
    const menu = generateMenu({
      dishes,
      currentMenu: emptyMenu(),
      rng: () => 0.5,
      constraint: 'healthy',
    })
    expect(menu.meals.map((m) => m.dishId)).not.toContain('b')
  })

  it('contrainte mostly-healthy : favorise mais n\'exclut pas', () => {
    const healthyDishes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7'].map((id) =>
      makeDish({ id, healthy: true }),
    )
    const indulgent = makeDish({ id: 'j', healthy: false })
    const dishes = [...healthyDishes, indulgent]
    const menu = generateMenu({
      dishes,
      currentMenu: emptyMenu(),
      rng: () => 0.999,
      constraint: 'mostly-healthy',
    })
    const ids = menu.meals.map((m) => m.dishId)
    expect(ids).toContain('j')
  })
})

describe('rating et saison dans generateMenu', () => {
  it('n\'exclut jamais un plat marqué « à éviter »', () => {
    const dishes = [
      makeDish({ id: 'a', rating: 'favorite' }),
      makeDish({ id: 'b', rating: 'avoid' }),
    ]
    for (let i = 0; i < 10; i++) {
      const menu = generateMenu({
        dishes,
        currentMenu: emptyMenu(),
        rng: () => 0.999,
      })
      expect(menu.meals.map((m) => m.dishId)).not.toContain('b')
    }
  })

  it('booste les favoris', () => {
    const favorite = makeDish({ id: 'fav', rating: 'favorite' })
    const neutral = makeDish({ id: 'neu', rating: 'neutral' })
    const draws = { fav: 0, neu: 0 }
    for (let i = 0; i < 200; i++) {
      const menu = generateMenu({
        dishes: [favorite, neutral],
        currentMenu: emptyMenu(),
      })
      const id = menu.meals.find((m) => m.day === 'lundi')?.dishId
      if (id) draws[id as 'fav' | 'neu']++
    }
    expect(draws.fav).toBeGreaterThan(draws.neu)
  })
})

describe('updateDishStats', () => {
  it('met à jour les stats des plats servis', () => {
    const dishes = [makeDish({ id: 'a' }), makeDish({ id: 'b' })]
    const menu = {
      ...emptyMenu(),
      meals: emptyMenu().meals.map((meal, index) =>
        index === 0 ? { ...meal, dishId: 'a' } : meal,
      ),
    }
    const updated = updateDishStats(dishes, menu)
    const a = updated.find((d) => d.id === 'a')
    const b = updated.find((d) => d.id === 'b')
    expect(a?.timesServed).toBe(1)
    expect(a?.lastServedAt).not.toBeNull()
    expect(b?.timesServed).toBe(0)
    expect(b?.lastServedAt).toBeNull()
  })
})
