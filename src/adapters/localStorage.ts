import type { StorageAdapter } from '../core/storage'
import type { Dish, Menu } from '../core/types'

const DISHES_KEY = 'menu-semaine:dishes'
const MENUS_KEY = 'menu-semaine:menus'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async loadDishes(): Promise<Dish[]> {
    return safeParse<Dish[]>(localStorage.getItem(DISHES_KEY), [])
  }

  async saveDishes(dishes: Dish[]): Promise<void> {
    localStorage.setItem(DISHES_KEY, JSON.stringify(dishes))
  }

  async loadMenu(weekStart: string): Promise<Menu | null> {
    const menus = safeParse<Record<string, Menu>>(
      localStorage.getItem(MENUS_KEY),
      {},
    )
    return menus[weekStart] ?? null
  }

  async saveMenu(menu: Menu): Promise<void> {
    const menus = safeParse<Record<string, Menu>>(
      localStorage.getItem(MENUS_KEY),
      {},
    )
    menus[menu.weekStart] = menu
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus))
  }
}
