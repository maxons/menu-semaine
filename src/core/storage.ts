import type { Dish, Menu } from './types'

export interface StorageAdapter {
  loadDishes(): Promise<Dish[]>
  saveDishes(dishes: Dish[]): Promise<void>
  loadMenu(weekStart: string): Promise<Menu | null>
  saveMenu(menu: Menu): Promise<void>
}

export interface AppState {
  dishes: Dish[]
  menus: Record<string, Menu>
}
