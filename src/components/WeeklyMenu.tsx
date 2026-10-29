import { useMenuStore } from '../store/menuStore'
import { DAYS } from '../core/types'

export default function WeeklyMenu() {
  const menu = useMenuStore((state) => state.menu)
  const dishes = useMenuStore((state) => state.dishes)
  const generateWeek = useMenuStore((state) => state.generateWeek)
  const rerollMeal = useMenuStore((state) => state.rerollMeal)
  const toggleForce = useMenuStore((state) => state.toggleForce)
  const setMealDish = useMenuStore((state) => state.setMealDish)

  const dishById = new Map(dishes.map((dish) => [dish.id, dish]))

  return (
    <section className="panel">
      <div className="menu-header">
        <h2>Menu de la semaine ({menu.weekStart})</h2>
        <button className="primary" onClick={generateWeek}>
          Générer la semaine
        </button>
      </div>
      <div className="menu-grid">
        {DAYS.map((day) => {
          const meal = menu.meals.find((m) => m.day === day)
          const dish = meal?.dishId ? dishById.get(meal.dishId) : null
          return (
            <div key={day} className={`meal-card ${meal?.forced ? 'forced' : ''}`}>
              <h3>{day}</h3>
              {dish ? (
                <span className="dish-name">{dish.name}</span>
              ) : (
                <span className="empty">—</span>
              )}
              <div className="meal-actions">
                <select
                  value={meal?.dishId ?? ''}
                  onChange={(event) =>
                    event.target.value
                      ? setMealDish(day, event.target.value)
                      : undefined
                  }
                >
                  <option value="">Choisir un plat…</option>
                  {dishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name}
                    </option>
                  ))}
                </select>
                <button onClick={() => rerollMeal(day)} title="Changer ce repas">
                  ⟳
                </button>
                <button
                  onClick={() => toggleForce(day)}
                  title={meal?.forced ? 'Déverrouiller' : 'Verrouiller'}
                >
                  {meal?.forced ? '🔒' : '🔓'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
