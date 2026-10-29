import { create } from 'zustand'
import type { CatalogDish, Dish, Meal, Menu, WeekConstraint } from '../core/types'
import { DAYS } from '../core/types'
import { generateMenu, updateDishStats } from '../core/generator'
import type { StorageAdapter } from '../core/storage'
import { LocalStorageAdapter } from '../adapters/localStorage'

export function currentWeekStart(now = new Date()): string {
  const date = new Date(now)
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  return date.toISOString().slice(0, 10)
}

function emptyMenu(weekStart: string): Menu {
  return {
    weekStart,
    meals: DAYS.map((day) => ({ day, dishId: null, forced: false })),
  }
}

interface MenuStore {
  dishes: Dish[]
  menu: Menu
  constraint: WeekConstraint
  storage: StorageAdapter
  hydrated: boolean
  hydrate: () => Promise<void>
  addDish: (dish: Omit<Dish, 'id' | 'lastServedAt' | 'timesServed'>) => void
  addCatalogDish: (catalogDish: CatalogDish) => void
  removeDish: (id: string) => void
  setConstraint: (constraint: WeekConstraint) => void
  generateWeek: () => void
  rerollMeal: (day: Meal['day']) => void
  toggleForce: (day: Meal['day']) => void
  setMealDish: (day: Meal['day'], dishId: string) => void
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  dishes: [],
  menu: emptyMenu(currentWeekStart()),
  constraint: 'none',
  storage: new LocalStorageAdapter(),
  hydrated: false,

  hydrate: async () => {
    const { storage } = get()
    const weekStart = currentWeekStart()
    const dishes = await storage.loadDishes()
    const menu = (await storage.loadMenu(weekStart)) ?? emptyMenu(weekStart)
    const storedConstraint = localStorage.getItem('menu-semaine:constraint')
    const constraint = (['none', 'pregnancy', 'healthy', 'mostly-healthy'] as const).find(
      (value) => value === storedConstraint,
    )
    set({ dishes, menu, constraint: constraint ?? 'none', hydrated: true })
  },

  addDish: (input) => {
    const dish: Dish = {
      ...input,
      id: crypto.randomUUID(),
      lastServedAt: null,
      timesServed: 0,
    }
    const dishes = [...get().dishes, dish]
    set({ dishes })
    void get().storage.saveDishes(dishes)
  },

  addCatalogDish: (catalogDish) => {
    if (get().dishes.some((d) => d.name === catalogDish.name)) return
    get().addDish({
      name: catalogDish.name,
      ingredients: catalogDish.ingredients,
      tags: catalogDish.tags,
      difficulty: catalogDish.difficulty,
      healthy: catalogDish.healthy,
      pregnancySafe: catalogDish.pregnancySafe,
      utensils: catalogDish.utensils,
      category: catalogDish.category,
    })
  },

  setConstraint: (constraint) => {
    set({ constraint })
    localStorage.setItem('menu-semaine:constraint', constraint)
  },

  removeDish: (id) => {
    const dishes = get().dishes.filter((dish) => dish.id !== id)
    const menu: Menu = {
      ...get().menu,
      meals: get().menu.meals.map((meal) =>
        meal.dishId === id ? { ...meal, dishId: null, forced: false } : meal,
      ),
    }
    set({ dishes, menu })
    void get().storage.saveDishes(dishes)
    void get().storage.saveMenu(menu)
  },

  generateWeek: () => {
    const { dishes, menu, constraint } = get()
    const nextMenu = generateMenu({ dishes, currentMenu: menu, constraint })
    const nextDishes = updateDishStats(dishes, nextMenu)
    set({ menu: nextMenu, dishes: nextDishes })
    void get().storage.saveMenu(nextMenu)
    void get().storage.saveDishes(nextDishes)
  },

  rerollMeal: (day) => {
    const { dishes, menu, constraint } = get()
    const target = menu.meals.find((meal) => meal.day === day)
    if (!target) return

    const others = menu.meals.filter((meal) => meal.day !== day)
    const tempMenu = {
      weekStart: menu.weekStart,
      meals: [
        ...others,
        { day, dishId: null, forced: false },
      ],
    }
    const [nextMeal] = generateMenu({ dishes, currentMenu: tempMenu, constraint }).meals.filter(
      (meal) => meal.day === day,
    )
    const meals = menu.meals.map((meal) =>
      meal.day === day ? { ...nextMeal, forced: false } : meal,
    )
    const nextMenu = { ...menu, meals }
    const now = new Date().toISOString()
    const nextDishes = nextMeal.dishId
      ? dishes.map((dish) =>
          dish.id === nextMeal.dishId
            ? { ...dish, lastServedAt: now, timesServed: dish.timesServed + 1 }
            : dish,
        )
      : dishes
    set({ menu: nextMenu, dishes: nextDishes })
    void get().storage.saveMenu(nextMenu)
    void get().storage.saveDishes(nextDishes)
  },

  toggleForce: (day) => {
    const { menu } = get()
    const meals = menu.meals.map((meal) =>
      meal.day === day ? { ...meal, forced: !meal.forced } : meal,
    )
    const nextMenu = { ...menu, meals }
    set({ menu: nextMenu })
    void get().storage.saveMenu(nextMenu)
  },

  setMealDish: (day, dishId) => {
    const { menu } = get()
    const meals = menu.meals.map((meal) =>
      meal.day === day ? { ...meal, dishId, forced: true } : meal,
    )
    const nextMenu = { ...menu, meals }
    set({ menu: nextMenu })
    void get().storage.saveMenu(nextMenu)
  },
}))


