import { useMemo, useState } from 'react'
import { useMenuStore } from '../store/menuStore'
import { estimateWeeklyBudget, budgetAlerts } from '../core/budget'
import { findLeftoverDishes } from '../core/leftovers'

export default function LeftoversAndBudget() {
  const menu = useMenuStore((state) => state.menu)
  const dishes = useMenuStore((state) => state.dishes)
  const [leftoverInput, setLeftoverInput] = useState('')
  const [threshold, setThreshold] = useState<string>('')

  const budget = useMemo(() => estimateWeeklyBudget(menu, dishes), [menu, dishes])
  const alerts = useMemo(
    () => budgetAlerts(budget, threshold ? Number(threshold) : null),
    [budget, threshold],
  )

  const leftovers = useMemo(
    () =>
      findLeftoverDishes(
        leftoverInput.split(',').map((entry) => entry.trim()),
        dishes,
      ),
    [leftoverInput, dishes],
  )

  return (
    <div className="columns">
      <section className="panel">
        <h2>🛒 Budget de la semaine</h2>
        <p>
          Total estimé :{' '}
          <strong>{budget.total.toFixed(2)} €</strong> ({budget.byMeal.length} repas,{' '}
          {budget.averagePerMeal.toFixed(2)} € / repas)
        </p>
        <label className="threshold">
            Alerte au-delà de
            <input
              type="number"
              min="0"
              step="5"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              placeholder="ex. 50"
            />
            €
          </label>
        {alerts.map((alert) => (
          <p key={alert.message} className={alert.type === 'over-threshold' ? 'alert' : 'muted'}>
            {alert.type === 'over-threshold' ? '⚠️ ' : ''}
            {alert.message}
          </p>
        ))}
      </section>

      <section className="panel">
        <h2>♻️ Mode restes</h2>
        <p className="muted">
          Dis ce que tu as dans le frigo, on trouve les plats de ton carnet qui
          l'utilisent.
        </p>
        <input
          value={leftoverInput}
          onChange={(event) => setLeftoverInput(event.target.value)}
          placeholder="ex. riz, champignons, crème"
        />
        {leftoverInput.trim() !== '' && (
          <ul className="leftover-list">
            {leftovers.map((match) => (
              <li key={match.dish.id}>
                <strong>{match.dish.name}</strong>{' '}
                <small className="muted">
                  — utilise {match.usedIngredients.join(', ')} (
                  {Math.round(match.coverage * 100)}% du plat)
                </small>
              </li>
            ))}
            {leftovers.length === 0 && (
              <li className="muted">Aucun plat de ton carnet n'utilise ces restes.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  )
}
