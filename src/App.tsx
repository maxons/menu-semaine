import { useEffect } from 'react'
import DishManager from './components/DishManager'
import WeeklyMenu from './components/WeeklyMenu'
import ShoppingList from './components/ShoppingList'
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
      <WeeklyMenu />
      <div className="columns">
        <DishManager />
        <ShoppingList />
      </div>
    </main>
  )
}
