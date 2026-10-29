import { describe, expect, it } from 'vitest'
import { dishWeight, generateMenu, updateDishStats } from './generator'
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
    ...overrides,
  }
}

function emptyMenu(): Menu {
  return {
    weekStart: '2025-01-06',
    meals: DAYS.map((day) => ({ day, dishId: null, forced: false })),
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
