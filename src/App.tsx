import { useEffect } from 'react'
import DishManager from './components/DishManager'
import CatalogBrowser from './components/CatalogBrowser'
import WeeklyMenu from './components/WeeklyMenu'
import ShoppingList from './components/ShoppingList'
import Discoveries from './components/Discoveries'
import LeftoversAndBudget from './components/LeftoversAndBudget'
import WeekBanner from './components/WeekBanner'
import { useMenuStore } from './store/menuStore'

export default function App() {
  const hydrate = useMenuStore((state) => state.hydrate)
  const hydrated = useMenuStore((state) => state.hydrated)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return <main className="app">Chargement…</main>
  }

  return (
    <main className="app">
      <h1>🍽️ Menu Semaine</h1>
      <WeekBanner />
      <WeeklyMenu />
      <LeftoversAndBudget />
      <div className="columns">
        <div>
          <DishManager />
          <CatalogBrowser />
        </div>
        <ShoppingList />
      </div>
      <Discoveries />
    </main>
  )
}
