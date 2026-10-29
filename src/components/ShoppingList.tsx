import { useMenuStore } from '../store/menuStore'
import { buildShoppingList } from '../core/shopping'

export default function ShoppingList() {
  const menu = useMenuStore((state) => state.menu)
  const dishes = useMenuStore((state) => state.dishes)
  const items = buildShoppingList(menu, dishes)

  return (
    <section className="panel">
      <h2>Liste de courses</h2>
      {items.length === 0 ? (
        <p className="empty">Génère un menu pour voir la liste de courses.</p>
      ) : (
        <ul className="shopping-list">
          {items.map((item) => (
            <li key={item.name}>
              {item.name}
              {item.display && <small> ({item.display})</small>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
