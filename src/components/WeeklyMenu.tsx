import { useMenuStore, addWeeks, formatWeekRange } from '../store/menuStore'
import { estimateDishPrice } from '../core/budget'
import { DAYS, WEEK_CONSTRAINT_LABELS } from '../core/types'
import type { WeekConstraint } from '../core/types'

export default function WeeklyMenu() {
  const menu = useMenuStore((state) => state.menu)
  const dishes = useMenuStore((state) => state.dishes)
  const constraint = useMenuStore((state) => state.constraint)
  const knownWeeks = useMenuStore((state) => state.knownWeeks)
  const setConstraint = useMenuStore((state) => state.setConstraint)
  const generateWeek = useMenuStore((state) => state.generateWeek)
  const rerollMeal = useMenuStore((state) => state.rerollMeal)
  const toggleForce = useMenuStore((state) => state.toggleForce)
  const setMealDish = useMenuStore((state) => state.setMealDish)
  const setMealServings = useMenuStore((state) => state.setMealServings)
  const goToWeek = useMenuStore((state) => state.goToWeek)
  const copyWeekFrom = useMenuStore((state) => state.copyWeekFrom)

  const dishById = new Map(dishes.map((dish) => [dish.id, dish]))
  const pastWeeks = knownWeeks.filter((week) => week < menu.weekStart).slice(-8)

  return (
    <section className="panel">
      <div className="week-nav">
        <button onClick={() => void goToWeek(addWeeks(menu.weekStart, -1))}>
          ← Semaine précédente
        </button>
        <strong>{formatWeekRange(menu.weekStart)}</strong>
        <button onClick={() => void goToWeek(addWeeks(menu.weekStart, 1))}>
          Semaine suivante →
        </button>
      </div>
      <div className="menu-header">
        <h2>Menu de la semaine</h2>
        <div className="menu-actions">
          {pastWeeks.length > 0 && (
            <select
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) {
                  void copyWeekFrom(event.target.value)
                  event.target.value = ''
                }
              }}
              title="Copier une semaine passée"
            >
              <option value="">Copier une semaine passée…</option>
              {pastWeeks.map((week) => (
                <option key={week} value={week}>
                  {formatWeekRange(week)}
                </option>
              ))}
            </select>
          )}
          <select
            value={constraint}
            onChange={(event) =>
              setConstraint(event.target.value as WeekConstraint)
            }
            title="Contrainte de la semaine"
          >
            {(Object.keys(WEEK_CONSTRAINT_LABELS) as WeekConstraint[]).map(
              (value) => (
                <option key={value} value={value}>
                  {WEEK_CONSTRAINT_LABELS[value]}
                </option>
              ),
            )}
          </select>
          <button className="primary" onClick={generateWeek}>
            Générer la semaine
          </button>
        </div>
      </div>
      <div className="menu-grid">
        {DAYS.map((day) => {
          const meal = menu.meals.find((m) => m.day === day)
          const dish = meal?.dishId ? dishById.get(meal.dishId) : null
          return (
            <div key={day} className={`meal-card ${meal?.forced ? 'forced' : ''}`}>
              <h3>{day}</h3>
              {dish ? (
                <>
                  <span className="dish-name">{dish.name}</span>
                  <small className="muted">
                    {estimateDishPrice(dish).toFixed(2)} € / 2 pers. ·{' '}
                    {((estimateDishPrice(dish) * (meal?.servings ?? 2)) / 2).toFixed(2)} € pour{' '}
                    {meal?.servings ?? 2} pers.
                  </small>
                </>
              ) : (
                <span className="empty">—</span>
              )}
              <div className="meal-actions">
                <label className="servings">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={meal?.servings ?? 2}
                    onChange={(event) =>
                      setMealServings(day, Number(event.target.value))
                    }
                  />
                  pers.
                </label>
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
