import { useMemo } from 'react'
import { useMenuStore } from '../store/menuStore'
import { holidaysInWeek, seasonForWeek } from '../core/season'

const SEASON_EMOJI: Record<string, string> = {
  hiver: '❄️',
  printemps: '🌸',
  ete: '☀️',
  automne: '🍂',
}

const SEASON_LABEL: Record<string, string> = {
  hiver: 'hiver',
  printemps: 'printemps',
  ete: 'été',
  automne: 'automne',
}

export default function WeekBanner() {
  const menu = useMenuStore((state) => state.menu)
  const season = seasonForWeek(menu.weekStart)
  const holidays = useMemo(() => holidaysInWeek(menu.weekStart), [menu.weekStart])

  return (
    <div className="week-banner">
      <span>
        {SEASON_EMOJI[season]} Semaine {SEASON_LABEL[season]} — les plats de
        saison sont favorisés.
      </span>
      {holidays.map((holiday) => (
        <span key={holiday.date} className="holiday">
          🎉 {holiday.name}
        </span>
      ))}
    </div>
  )
}
