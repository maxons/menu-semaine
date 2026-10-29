import { create } from 'zustand'
import type { Dish, Meal, Menu } from '../core/types'
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
  storage: StorageAdapter
  hydrated: boolean
  hydrate: () => Promise<void>
  addDish: (dish: Omit<Dish, 'id' | 'lastServedAt' | 'timesServed'>) => void
  removeDish: (id: string) => void
  generateWeek: () => void
  rerollMeal: (day: Meal['day']) => void
  toggleForce: (day: Meal['day']) => void
  setMealDish: (day: Meal['day'], dishId: string) => void
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  dishes: [],
  menu: emptyMenu(currentWeekStart()),
  storage: new LocalStorageAdapter(),
  hydrated: false,

  hydrate: async () => {
    const { storage } = get()
    const weekStart = currentWeekStart()
    const dishes = await storage.loadDishes()
    const menu = (await storage.loadMenu(weekStart)) ?? emptyMenu(weekStart)
    set({ dishes, menu, hydrated: true })
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
    const { dishes, menu } = get()
    const nextMenu = generateMenu({ dishes, currentMenu: menu })
    const nextDishes = updateDishStats(dishes, nextMenu)
    set({ menu: nextMenu, dishes: nextDishes })
    void get().storage.saveMenu(nextMenu)
    void get().storage.saveDishes(nextDishes)
  },

  rerollMeal: (day) => {
    const { dishes, menu } = get()
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
    const [nextMeal] = generateMenu({ dishes, currentMenu: tempMenu }).meals.filter(
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


